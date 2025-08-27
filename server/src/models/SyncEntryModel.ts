import { BaseModel } from './BaseModel';
import { v4 as uuidv4 } from 'uuid';

export interface SyncEntry {
  id: number;
  uuid: string;
  user_id: number;
  device_id: string;
  table_name: string;
  record_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: Date;
  sync_status: 'pending' | 'processed' | 'failed' | 'conflict';
  conflict_resolution?: 'local_wins' | 'remote_wins' | 'merged' | 'manual';
  created_at: Date;
  updated_at: Date;
}

export interface CreateSyncEntry {
  user_id: number;
  device_id: string;
  table_name: string;
  record_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: Date;
  sync_status?: 'pending' | 'processed' | 'failed' | 'conflict';
}

export interface UpdateSyncEntry {
  sync_status?: 'pending' | 'processed' | 'failed' | 'conflict';
  conflict_resolution?: 'local_wins' | 'remote_wins' | 'merged' | 'manual';
  data?: any;
}

export interface SyncPushRequest {
  device_id: string;
  changes: Array<{
    table: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    record_id: string;
    data: any;
    timestamp: number;
  }>;
}

export interface SyncPullRequest {
  device_id: string;
  last_sync: number;
}

export interface SyncConflict {
  id: number;
  sync_entry_id: number;
  table_name: string;
  record_id: string;
  local_data: any;
  remote_data: any;
  local_timestamp: Date;
  remote_timestamp: Date;
  conflict_type: 'concurrent_update' | 'delete_update' | 'update_delete';
  resolved: boolean;
  resolution?: 'local_wins' | 'remote_wins' | 'merged' | 'manual';
  resolved_at?: Date;
  resolved_by?: number;
  created_at: Date;
}

export class SyncEntryModel extends BaseModel {
  async findAll(userId: number, options: {
    page?: number;
    limit?: number;
    status?: string;
    deviceId?: string;
    tableName?: string;
  } = {}): Promise<{ data: SyncEntry[], total: number }> {
    const { page = 1, limit = 50, status, deviceId, tableName } = options;
    
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND sync_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (deviceId) {
      whereClause += ` AND device_id = $${paramIndex}`;
      params.push(deviceId);
      paramIndex++;
    }

    if (tableName) {
      whereClause += ` AND table_name = $${paramIndex}`;
      params.push(tableName);
      paramIndex++;
    }

    // Получить общее количество
    const countQuery = `SELECT COUNT(*) as total FROM sync_entries ${whereClause}`;
    const totalResult = await this.executeQuerySingle<{ total: string }>(countQuery, params);
    const total = parseInt(totalResult?.total || '0');

    // Получить данные с пагинацией
    const dataQuery = `
      SELECT id, uuid, user_id, device_id, table_name, record_id, operation, 
             data, timestamp, sync_status, conflict_resolution, created_at, updated_at
      FROM sync_entries 
      ${whereClause}
      ORDER BY timestamp DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, (page - 1) * limit);

    const data = await this.executeQuery<SyncEntry>(dataQuery, params);

    return { data, total };
  }

  async findById(id: number): Promise<SyncEntry | null> {
    const query = `
      SELECT id, uuid, user_id, device_id, table_name, record_id, operation,
             data, timestamp, sync_status, conflict_resolution, created_at, updated_at
      FROM sync_entries 
      WHERE id = $1
    `;
    return this.executeQuerySingle<SyncEntry>(query, [id]);
  }

  async findPendingForDevice(deviceId: string, userId: number, lastSync?: Date): Promise<SyncEntry[]> {
    let query = `
      SELECT id, uuid, user_id, device_id, table_name, record_id, operation,
             data, timestamp, sync_status, conflict_resolution, created_at, updated_at
      FROM sync_entries 
      WHERE user_id = $1 AND device_id != $2 AND sync_status = 'processed'
    `;
    const params: any[] = [userId, deviceId];

    if (lastSync) {
      query += ` AND timestamp > $3`;
      params.push(lastSync);
    }

    query += ` ORDER BY timestamp ASC LIMIT 100`;

    return this.executeQuery<SyncEntry>(query, params);
  }

  async create(entryData: CreateSyncEntry): Promise<SyncEntry> {
    const entryUuid = uuidv4();
    
    const query = `
      INSERT INTO sync_entries (uuid, user_id, device_id, table_name, record_id, 
                               operation, data, timestamp, sync_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, uuid, user_id, device_id, table_name, record_id, operation,
                data, timestamp, sync_status, conflict_resolution, created_at, updated_at
    `;
    
    const values = [
      entryUuid,
      entryData.user_id,
      entryData.device_id,
      entryData.table_name,
      entryData.record_id,
      entryData.operation,
      JSON.stringify(entryData.data),
      entryData.timestamp,
      entryData.sync_status || 'pending'
    ];

    return this.executeQuerySingle<SyncEntry>(query, values) as Promise<SyncEntry>;
  }

  async update(id: number, updateData: UpdateSyncEntry): Promise<SyncEntry> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.sync_status !== undefined) {
      fields.push(`sync_status = $${paramIndex++}`);
      values.push(updateData.sync_status);
    }

    if (updateData.conflict_resolution !== undefined) {
      fields.push(`conflict_resolution = $${paramIndex++}`);
      values.push(updateData.conflict_resolution);
    }

    if (updateData.data !== undefined) {
      fields.push(`data = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.data));
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id);

    const query = `
      UPDATE sync_entries 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, uuid, user_id, device_id, table_name, record_id, operation,
                data, timestamp, sync_status, conflict_resolution, created_at, updated_at
    `;

    return this.executeQuerySingle<SyncEntry>(query, values) as Promise<SyncEntry>;
  }

  async delete(id: number): Promise<void> {
    const query = 'DELETE FROM sync_entries WHERE id = $1';
    await this.executeQuery(query, [id]);
  }

  async findConflictingEntry(
    tableName: string, 
    recordId: string, 
    userId: number, 
    excludeDeviceId: string,
    afterTimestamp?: Date
  ): Promise<SyncEntry | null> {
    let query = `
      SELECT id, uuid, user_id, device_id, table_name, record_id, operation,
             data, timestamp, sync_status, conflict_resolution, created_at, updated_at
      FROM sync_entries 
      WHERE table_name = $1 AND record_id = $2 AND user_id = $3 AND device_id != $4
    `;
    const params: any[] = [tableName, recordId, userId, excludeDeviceId];

    if (afterTimestamp) {
      query += ` AND timestamp > $5`;
      params.push(afterTimestamp);
    }

    query += ` ORDER BY timestamp DESC LIMIT 1`;

    return this.executeQuerySingle<SyncEntry>(query, params);
  }

  async createConflict(conflictData: {
    sync_entry_id: number;
    table_name: string;
    record_id: string;
    local_data: any;
    remote_data: any;
    local_timestamp: Date;
    remote_timestamp: Date;
    conflict_type: 'concurrent_update' | 'delete_update' | 'update_delete';
  }): Promise<SyncConflict> {
    const query = `
      INSERT INTO sync_conflicts (sync_entry_id, table_name, record_id, local_data, 
                                 remote_data, local_timestamp, remote_timestamp, conflict_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, sync_entry_id, table_name, record_id, local_data, remote_data,
                local_timestamp, remote_timestamp, conflict_type, resolved, resolution,
                resolved_at, resolved_by, created_at
    `;
    
    const values = [
      conflictData.sync_entry_id,
      conflictData.table_name,
      conflictData.record_id,
      JSON.stringify(conflictData.local_data),
      JSON.stringify(conflictData.remote_data),
      conflictData.local_timestamp,
      conflictData.remote_timestamp,
      conflictData.conflict_type
    ];

    return this.executeQuerySingle<SyncConflict>(query, values) as Promise<SyncConflict>;
  }

  async getConflicts(userId: number, resolved: boolean = false): Promise<SyncConflict[]> {
    const query = `
      SELECT sc.id, sc.sync_entry_id, sc.table_name, sc.record_id, sc.local_data, 
             sc.remote_data, sc.local_timestamp, sc.remote_timestamp, sc.conflict_type,
             sc.resolved, sc.resolution, sc.resolved_at, sc.resolved_by, sc.created_at
      FROM sync_conflicts sc
      INNER JOIN sync_entries se ON sc.sync_entry_id = se.id
      WHERE se.user_id = $1 AND sc.resolved = $2
      ORDER BY sc.created_at DESC
    `;
    
    return this.executeQuery<SyncConflict>(query, [userId, resolved]);
  }

  async resolveConflict(
    conflictId: number, 
    resolution: 'local_wins' | 'remote_wins' | 'merged' | 'manual',
    resolvedBy: number,
    finalData?: any
  ): Promise<SyncConflict> {
    const query = `
      UPDATE sync_conflicts 
      SET resolved = true, resolution = $1, resolved_by = $2, resolved_at = $3
      WHERE id = $4
      RETURNING id, sync_entry_id, table_name, record_id, local_data, remote_data,
                local_timestamp, remote_timestamp, conflict_type, resolved, resolution,
                resolved_at, resolved_by, created_at
    `;
    
    const result = await this.executeQuerySingle<SyncConflict>(
      query, 
      [resolution, resolvedBy, new Date(), conflictId]
    ) as SyncConflict;

    // Если предоставлены финальные данные, обновляем связанную запись синхронизации
    if (finalData && result.sync_entry_id) {
      await this.update(result.sync_entry_id, {
        data: finalData,
        sync_status: 'processed',
        conflict_resolution: resolution
      });
    }

    return result;
  }

  async getStats(userId: number): Promise<{
    total: number;
    pending: number;
    processed: number;
    failed: number;
    conflicts: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN sync_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN sync_status = 'processed' THEN 1 END) as processed,
        COUNT(CASE WHEN sync_status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN sync_status = 'conflict' THEN 1 END) as conflicts
      FROM sync_entries 
      WHERE user_id = $1
    `;
    
    return this.executeQuerySingle<{
      total: number;
      pending: number;
      processed: number;
      failed: number;
      conflicts: number;
    }>(query, [userId]) as Promise<{
      total: number;
      pending: number;
      processed: number;
      failed: number;
      conflicts: number;
    }>;
  }

  async cleanupOldEntries(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const query = `
      DELETE FROM sync_entries 
      WHERE sync_status = 'processed' AND created_at < $1
    `;
    
    const result = await this.executeQuery(query, [cutoffDate]);
    return (result as any).rowCount || 0;
  }
}
