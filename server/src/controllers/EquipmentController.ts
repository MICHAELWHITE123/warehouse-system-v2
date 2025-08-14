import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { EquipmentModel } from '../models/EquipmentModel';
import { CreateEquipment, UpdateEquipment } from '../types/database';

export class EquipmentController extends BaseController {
  private equipmentModel = new EquipmentModel();

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, offset } = this.getPagination(req);
      const { search, category_id, location_id, status } = req.query;

      const result = await this.equipmentModel.findAll({
        page,
        limit,
        offset,
        search: search as string,
        category_id: category_id ? parseInt(category_id as string) : undefined,
        location_id: location_id ? parseInt(location_id as string) : undefined,
        status: status as string
      });

      this.successPaginated(res, result.data, result.pagination);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public search = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, limit = 10 } = req.query;

      if (!q) {
        this.error(res, 'Search query is required');
        return;
      }

      const results = await this.equipmentModel.search(
        q as string,
        parseInt(limit as string)
      );

      this.success(res, results);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const equipment = await this.equipmentModel.findById(parseInt(id));

      if (!equipment) {
        this.notFound(res, 'Equipment');
        return;
      }

      this.success(res, equipment);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const equipmentData: CreateEquipment = req.body;
      const userId = (req as any).user?.userId;

      // Проверить уникальность серийного номера (если предоставлен)
      if (equipmentData.serial_number) {
        const existingEquipment = await this.equipmentModel.findBySerialNumber(equipmentData.serial_number);
        if (existingEquipment) {
          this.error(res, 'Equipment with this serial number already exists', 409);
          return;
        }
      }

      const newEquipment = await this.equipmentModel.create({
        ...equipmentData,
        created_by: userId
      });

      this.success(res, newEquipment, 'Equipment created successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateEquipment = req.body;

      // Проверить существование оборудования
      const existingEquipment = await this.equipmentModel.findById(parseInt(id));
      if (!existingEquipment) {
        this.notFound(res, 'Equipment');
        return;
      }

      // Проверить уникальность серийного номера (если он изменяется)
      if (updateData.serial_number && updateData.serial_number !== existingEquipment.serial_number) {
        const equipmentWithSerial = await this.equipmentModel.findBySerialNumber(updateData.serial_number);
        if (equipmentWithSerial) {
          this.error(res, 'Equipment with this serial number already exists', 409);
          return;
        }
      }

      const updatedEquipment = await this.equipmentModel.update(parseInt(id), updateData);

      this.success(res, updatedEquipment, 'Equipment updated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['available', 'in-use', 'maintenance'].includes(status)) {
        this.error(res, 'Invalid status. Must be one of: available, in-use, maintenance');
        return;
      }

      const equipment = await this.equipmentModel.findById(parseInt(id));
      if (!equipment) {
        this.notFound(res, 'Equipment');
        return;
      }

      const updatedEquipment = await this.equipmentModel.update(parseInt(id), { status });

      this.success(res, updatedEquipment, 'Equipment status updated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const equipment = await this.equipmentModel.findById(parseInt(id));
      if (!equipment) {
        this.notFound(res, 'Equipment');
        return;
      }

      // Проверить, используется ли оборудование в стеках или отгрузках
      const isUsedInStacks = await this.equipmentModel.isUsedInStacks(parseInt(id));
      const isUsedInShipments = await this.equipmentModel.isUsedInShipments(parseInt(id));

      if (isUsedInStacks || isUsedInShipments) {
        this.error(res, 'Cannot delete equipment. It is used in stacks or shipments.');
        return;
      }

      await this.equipmentModel.delete(parseInt(id));

      this.success(res, null, 'Equipment deleted successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };
}
