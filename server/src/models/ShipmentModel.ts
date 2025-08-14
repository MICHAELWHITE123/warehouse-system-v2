import { BaseModel } from './BaseModel';
import { Shipment, ShipmentWithDetails, ShipmentChecklist, ShipmentRental, CreateShipment, UpdateShipment, PaginatedResponse } from '../types/database';

interface FindAllOptions {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export class ShipmentModel extends BaseModel {
  async findAll(options: FindAllOptions): Promise<PaginatedResponse<ShipmentWithDetails>> {
    const { page, limit, search, status, date_from, date_to } = options;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    const conditions: string[] = [];

    if (search) {
      conditions.push(`(s.number ILIKE $${paramIndex} OR s.recipient ILIKE $${paramIndex} OR s.responsible_person ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`s.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (date_from) {
      conditions.push(`s.date >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      conditions.push(`s.date <= $${paramIndex}`);
      params.push(date_to);
      paramIndex++;
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Получить общее количество
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM shipments s 
      ${whereClause}
    `;
    const totalResult = await this.executeQuerySingle<{ total: string }>(countQuery, params);
    const total = parseInt(totalResult?.total || '0');

    // Получить данные с пагинацией
    const dataQuery = `
      SELECT 
        s.id, s.uuid, s.number, s.date, s.recipient, s.recipient_address, 
        s.status, s.responsible_person, s.total_items, s.comments, 
        s.created_by, s.created_at, s.updated_at, s.delivered_at,
        u.username as created_by_name
      FROM shipments s
      LEFT JOIN users u ON s.created_by = u.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, (page - 1) * limit);

    const shipments = await this.executeQuery<ShipmentWithDetails>(dataQuery, params);

    // Для каждой отгрузки получить детали
    for (const shipment of shipments) {
      shipment.equipment = await this.getShipmentEquipment(shipment.id);
      shipment.stacks = await this.getShipmentStacks(shipment.id);
      shipment.checklist = await this.getShipmentChecklist(shipment.id);
      shipment.rental = await this.getShipmentRental(shipment.id);
    }

    return {
      data: shipments,
      pagination: this.calculatePagination(page, limit, total)
    };
  }

  async findById(id: number): Promise<Shipment | null> {
    const query = `
      SELECT id, uuid, number, date, recipient, recipient_address, status,
             responsible_person, total_items, comments, created_by, 
             created_at, updated_at, delivered_at
      FROM shipments 
      WHERE id = $1
    `;
    return this.executeQuerySingle<Shipment>(query, [id]);
  }

  async findByIdWithDetails(id: number): Promise<ShipmentWithDetails | null> {
    const query = `
      SELECT 
        s.id, s.uuid, s.number, s.date, s.recipient, s.recipient_address, 
        s.status, s.responsible_person, s.total_items, s.comments, 
        s.created_by, s.created_at, s.updated_at, s.delivered_at,
        u.username as created_by_name
      FROM shipments s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = $1
    `;
    
    const shipment = await this.executeQuerySingle<ShipmentWithDetails>(query, [id]);
    
    if (shipment) {
      shipment.equipment = await this.getShipmentEquipment(id);
      shipment.stacks = await this.getShipmentStacks(id);
      shipment.checklist = await this.getShipmentChecklist(id);
      shipment.rental = await this.getShipmentRental(id);
    }
    
    return shipment;
  }

  async findByNumber(number: string): Promise<Shipment | null> {
    const query = `
      SELECT id, uuid, number, date, recipient, recipient_address, status,
             responsible_person, total_items, comments, created_by, 
             created_at, updated_at, delivered_at
      FROM shipments 
      WHERE number = $1
    `;
    return this.executeQuerySingle<Shipment>(query, [number]);
  }

  private async getShipmentEquipment(shipmentId: number) {
    const query = `
      SELECT 
        se.id, se.shipment_id, se.equipment_id, se.quantity, se.created_at,
        e.id, e.uuid, e.name, e.category_id, e.serial_number, e.status, 
        e.location_id, e.purchase_date, e.last_maintenance, e.assigned_to, 
        e.description, e.specifications, e.created_by, e.created_at as equipment_created_at, 
        e.updated_at as equipment_updated_at,
        c.name as category_name,
        l.name as location_name,
        u.username as created_by_name
      FROM shipment_equipment se
      JOIN equipment e ON se.equipment_id = e.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE se.shipment_id = $1
      ORDER BY e.name ASC
    `;
    return this.executeQuery(query, [shipmentId]);
  }

  private async getShipmentStacks(shipmentId: number) {
    const query = `
      SELECT 
        ss.id, ss.shipment_id, ss.stack_id, ss.quantity, ss.created_at,
        s.id, s.uuid, s.name, s.description, s.created_by, s.tags, 
        s.created_at as stack_created_at, s.updated_at as stack_updated_at,
        u.username as created_by_name
      FROM shipment_stacks ss
      JOIN equipment_stacks s ON ss.stack_id = s.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE ss.shipment_id = $1
      ORDER BY s.name ASC
    `;
    return this.executeQuery(query, [shipmentId]);
  }

  private async getShipmentChecklist(shipmentId: number): Promise<ShipmentChecklist[]> {
    const query = `
      SELECT id, uuid, shipment_id, title, description, is_completed, 
             is_required, completed_by, completed_at, created_at
      FROM shipment_checklist
      WHERE shipment_id = $1
      ORDER BY created_at ASC
    `;
    return this.executeQuery<ShipmentChecklist>(query, [shipmentId]);
  }

  private async getShipmentRental(shipmentId: number): Promise<ShipmentRental[]> {
    const query = `
      SELECT id, uuid, shipment_id, equipment_name, quantity, link, created_at
      FROM shipment_rental
      WHERE shipment_id = $1
      ORDER BY created_at ASC
    `;
    return this.executeQuery<ShipmentRental>(query, [shipmentId]);
  }

  async create(shipmentData: CreateShipment & { created_by?: number }): Promise<Shipment> {
    // Рассчитать общее количество элементов
    let totalItems = 0;
    if (shipmentData.equipment_items) {
      totalItems += shipmentData.equipment_items.reduce((sum, item) => sum + item.quantity, 0);
    }
    if (shipmentData.stack_items) {
      totalItems += shipmentData.stack_items.reduce((sum, item) => sum + item.quantity, 0);
    }
    if (shipmentData.rental) {
      totalItems += shipmentData.rental.reduce((sum, item) => sum + item.quantity, 0);
    }

    const query = `
      INSERT INTO shipments (
        number, date, recipient, recipient_address, status, 
        responsible_person, total_items, comments, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, uuid, number, date, recipient, recipient_address, status,
                responsible_person, total_items, comments, created_by, 
                created_at, updated_at, delivered_at
    `;
    
    const values = [
      shipmentData.number,
      shipmentData.date,
      shipmentData.recipient,
      shipmentData.recipient_address,
      shipmentData.status || 'preparing',
      shipmentData.responsible_person,
      totalItems,
      shipmentData.comments || null,
      shipmentData.created_by || null
    ];

    const newShipment = await this.executeQuerySingle<Shipment>(query, values) as Shipment;

    // Добавить оборудование
    if (shipmentData.equipment_items && shipmentData.equipment_items.length > 0) {
      await this.addEquipmentToShipment(newShipment.id, shipmentData.equipment_items);
    }

    // Добавить стеки
    if (shipmentData.stack_items && shipmentData.stack_items.length > 0) {
      await this.addStacksToShipment(newShipment.id, shipmentData.stack_items);
    }

    // Добавить чек-лист
    if (shipmentData.checklist && shipmentData.checklist.length > 0) {
      for (const item of shipmentData.checklist) {
        await this.addChecklistItem(newShipment.id, item);
      }
    }

    // Добавить аренду
    if (shipmentData.rental && shipmentData.rental.length > 0) {
      for (const item of shipmentData.rental) {
        await this.addRental(newShipment.id, item);
      }
    }

    return newShipment;
  }

  private async addEquipmentToShipment(shipmentId: number, equipment: { equipment_id: number; quantity: number }[]): Promise<void> {
    if (equipment.length === 0) return;

    const values: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const item of equipment) {
      values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
      params.push(shipmentId, item.equipment_id, item.quantity);
      paramIndex += 3;
    }

    const query = `
      INSERT INTO shipment_equipment (shipment_id, equipment_id, quantity)
      VALUES ${values.join(', ')}
    `;

    await this.executeQuery(query, params);
  }

  private async addStacksToShipment(shipmentId: number, stacks: { stack_id: number; quantity: number }[]): Promise<void> {
    if (stacks.length === 0) return;

    const values: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const item of stacks) {
      values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
      params.push(shipmentId, item.stack_id, item.quantity);
      paramIndex += 3;
    }

    const query = `
      INSERT INTO shipment_stacks (shipment_id, stack_id, quantity)
      VALUES ${values.join(', ')}
    `;

    await this.executeQuery(query, params);
  }

  async update(id: number, updateData: UpdateShipment): Promise<Shipment> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.number !== undefined) {
      fields.push(`number = $${paramIndex++}`);
      values.push(updateData.number);
    }

    if (updateData.date !== undefined) {
      fields.push(`date = $${paramIndex++}`);
      values.push(updateData.date);
    }

    if (updateData.recipient !== undefined) {
      fields.push(`recipient = $${paramIndex++}`);
      values.push(updateData.recipient);
    }

    if (updateData.recipient_address !== undefined) {
      fields.push(`recipient_address = $${paramIndex++}`);
      values.push(updateData.recipient_address);
    }

    if (updateData.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }

    if (updateData.responsible_person !== undefined) {
      fields.push(`responsible_person = $${paramIndex++}`);
      values.push(updateData.responsible_person);
    }

    if (updateData.comments !== undefined) {
      fields.push(`comments = $${paramIndex++}`);
      values.push(updateData.comments);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE shipments 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, uuid, number, date, recipient, recipient_address, status,
                responsible_person, total_items, comments, created_by, 
                created_at, updated_at, delivered_at
    `;

    return this.executeQuerySingle<Shipment>(query, values) as Promise<Shipment>;
  }

  async addChecklistItem(shipmentId: number, item: { title: string; description?: string; is_required?: boolean }): Promise<ShipmentChecklist> {
    const query = `
      INSERT INTO shipment_checklist (shipment_id, title, description, is_required)
      VALUES ($1, $2, $3, $4)
      RETURNING id, uuid, shipment_id, title, description, is_completed, 
                is_required, completed_by, completed_at, created_at
    `;
    
    const values = [
      shipmentId,
      item.title,
      item.description || null,
      item.is_required !== false
    ];

    return this.executeQuerySingle<ShipmentChecklist>(query, values) as Promise<ShipmentChecklist>;
  }

  async updateChecklistItem(itemId: number, updateData: any): Promise<ShipmentChecklist> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(itemId);

    const query = `
      UPDATE shipment_checklist 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, uuid, shipment_id, title, description, is_completed, 
                is_required, completed_by, completed_at, created_at
    `;

    return this.executeQuerySingle<ShipmentChecklist>(query, values) as Promise<ShipmentChecklist>;
  }

  async deleteChecklistItem(itemId: number): Promise<void> {
    const query = 'DELETE FROM shipment_checklist WHERE id = $1';
    await this.executeQuery(query, [itemId]);
  }

  async addRental(shipmentId: number, item: { equipment_name: string; quantity: number; link?: string }): Promise<ShipmentRental> {
    const query = `
      INSERT INTO shipment_rental (shipment_id, equipment_name, quantity, link)
      VALUES ($1, $2, $3, $4)
      RETURNING id, uuid, shipment_id, equipment_name, quantity, link, created_at
    `;
    
    const values = [
      shipmentId,
      item.equipment_name,
      item.quantity,
      item.link || null
    ];

    return this.executeQuerySingle<ShipmentRental>(query, values) as Promise<ShipmentRental>;
  }

  async updateRental(rentalId: number, updateData: any): Promise<ShipmentRental> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(rentalId);

    const query = `
      UPDATE shipment_rental 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, uuid, shipment_id, equipment_name, quantity, link, created_at
    `;

    return this.executeQuerySingle<ShipmentRental>(query, values) as Promise<ShipmentRental>;
  }

  async deleteRental(rentalId: number): Promise<void> {
    const query = 'DELETE FROM shipment_rental WHERE id = $1';
    await this.executeQuery(query, [rentalId]);
  }

  async delete(id: number): Promise<void> {
    // Каскадное удаление обеспечивается на уровне БД
    const query = 'DELETE FROM shipments WHERE id = $1';
    await this.executeQuery(query, [id]);
  }
}
