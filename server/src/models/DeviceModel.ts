import { BaseModel } from './BaseModel';
import { v4 as uuidv4 } from 'uuid';

export interface Device {
  id: number;
  uuid: string;
  user_id: number;
  device_id: string;
  device_name: string;
  device_type?: string;
  platform?: string;
  last_sync: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDevice {
  user_id: number;
  device_id: string;
  device_name: string;
  device_type?: string;
  platform?: string;
}

export interface UpdateDevice {
  device_name?: string;
  device_type?: string;
  platform?: string;
  last_sync?: Date;
  is_active?: boolean;
}

export class DeviceModel extends BaseModel {
  async findAll(userId: number): Promise<Device[]> {
    const query = `
      SELECT id, uuid, user_id, device_id, device_name, device_type, platform, 
             last_sync, is_active, created_at, updated_at
      FROM devices 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    return this.executeQuery<Device>(query, [userId]);
  }

  async findById(id: number): Promise<Device | null> {
    const query = `
      SELECT id, uuid, user_id, device_id, device_name, device_type, platform,
             last_sync, is_active, created_at, updated_at
      FROM devices 
      WHERE id = $1
    `;
    return this.executeQuerySingle<Device>(query, [id]);
  }

  async findByDeviceId(deviceId: string, userId?: number): Promise<Device | null> {
    let query = `
      SELECT id, uuid, user_id, device_id, device_name, device_type, platform,
             last_sync, is_active, created_at, updated_at
      FROM devices 
      WHERE device_id = $1
    `;
    const params: any[] = [deviceId];

    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }

    return this.executeQuerySingle<Device>(query, params);
  }

  async create(deviceData: CreateDevice): Promise<Device> {
    const deviceUuid = uuidv4();
    
    const query = `
      INSERT INTO devices (uuid, user_id, device_id, device_name, device_type, platform, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, uuid, user_id, device_id, device_name, device_type, platform,
                last_sync, is_active, created_at, updated_at
    `;
    
    const values = [
      deviceUuid,
      deviceData.user_id,
      deviceData.device_id,
      deviceData.device_name,
      deviceData.device_type || null,
      deviceData.platform || null,
      true
    ];

    return this.executeQuerySingle<Device>(query, values) as Promise<Device>;
  }

  async update(id: number, updateData: UpdateDevice): Promise<Device> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.device_name !== undefined) {
      fields.push(`device_name = $${paramIndex++}`);
      values.push(updateData.device_name);
    }

    if (updateData.device_type !== undefined) {
      fields.push(`device_type = $${paramIndex++}`);
      values.push(updateData.device_type);
    }

    if (updateData.platform !== undefined) {
      fields.push(`platform = $${paramIndex++}`);
      values.push(updateData.platform);
    }

    if (updateData.last_sync !== undefined) {
      fields.push(`last_sync = $${paramIndex++}`);
      values.push(updateData.last_sync);
    }

    if (updateData.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updateData.is_active);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id);

    const query = `
      UPDATE devices 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, uuid, user_id, device_id, device_name, device_type, platform,
                last_sync, is_active, created_at, updated_at
    `;

    return this.executeQuerySingle<Device>(query, values) as Promise<Device>;
  }

  async updateLastSync(deviceId: string, userId: number): Promise<void> {
    const query = `
      UPDATE devices 
      SET last_sync = $1, updated_at = $1
      WHERE device_id = $2 AND user_id = $3
    `;
    
    await this.executeQuery(query, [new Date(), deviceId, userId]);
  }

  async delete(id: number): Promise<void> {
    const query = 'DELETE FROM devices WHERE id = $1';
    await this.executeQuery(query, [id]);
  }

  async deactivate(id: number): Promise<Device> {
    const query = `
      UPDATE devices 
      SET is_active = false, updated_at = $1
      WHERE id = $2
      RETURNING id, uuid, user_id, device_id, device_name, device_type, platform,
                last_sync, is_active, created_at, updated_at
    `;
    
    return this.executeQuerySingle<Device>(query, [new Date(), id]) as Promise<Device>;
  }

  async getUserDevices(userId: number, activeOnly: boolean = true): Promise<Device[]> {
    let query = `
      SELECT id, uuid, user_id, device_id, device_name, device_type, platform,
             last_sync, is_active, created_at, updated_at
      FROM devices 
      WHERE user_id = $1
    `;
    
    if (activeOnly) {
      query += ` AND is_active = true`;
    }
    
    query += ` ORDER BY last_sync DESC, created_at DESC`;

    return this.executeQuery<Device>(query, [userId]);
  }
}
