import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { StackModel } from '../models/StackModel';
import { CreateEquipmentStack, UpdateEquipmentStack } from '../types/database';

export class StackController extends BaseController {
  private stackModel = new StackModel();

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, offset } = this.getPagination(req);
      const { search, tags } = req.query;

      const result = await this.stackModel.findAll({
        page,
        limit,
        offset,
        search: search as string,
        tags: tags ? (tags as string).split(',') : undefined
      });

      this.successPaginated(res, result.data, result.pagination);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const stack = await this.stackModel.findByIdWithEquipment(parseInt(id));

      if (!stack) {
        this.notFound(res, 'Stack');
        return;
      }

      this.success(res, stack);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const stackData: CreateEquipmentStack = req.body;
      const userId = (req as any).user?.userId;

      // Проверить уникальность названия
      const existingStack = await this.stackModel.findByName(stackData.name);
      if (existingStack) {
        this.error(res, 'Stack with this name already exists', 409);
        return;
      }

      const newStack = await this.stackModel.create({
        ...stackData,
        created_by: userId
      });

      this.success(res, newStack, 'Stack created successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateEquipmentStack = req.body;

      // Проверить существование стека
      const existingStack = await this.stackModel.findById(parseInt(id));
      if (!existingStack) {
        this.notFound(res, 'Stack');
        return;
      }

      // Проверить уникальность названия (если оно изменяется)
      if (updateData.name && updateData.name !== existingStack.name) {
        const stackWithName = await this.stackModel.findByName(updateData.name);
        if (stackWithName) {
          this.error(res, 'Stack with this name already exists', 409);
          return;
        }
      }

      const updatedStack = await this.stackModel.update(parseInt(id), updateData);

      this.success(res, updatedStack, 'Stack updated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public addEquipment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { equipment_ids } = req.body;

      if (!Array.isArray(equipment_ids) || equipment_ids.length === 0) {
        this.error(res, 'equipment_ids must be a non-empty array');
        return;
      }

      // Проверить существование стека
      const stack = await this.stackModel.findById(parseInt(id));
      if (!stack) {
        this.notFound(res, 'Stack');
        return;
      }

      await this.stackModel.addEquipment(parseInt(id), equipment_ids);

      // Получить обновленный стек с оборудованием
      const updatedStack = await this.stackModel.findByIdWithEquipment(parseInt(id));

      this.success(res, updatedStack, 'Equipment added to stack successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public removeEquipment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, equipmentId } = req.params;

      // Проверить существование стека
      const stack = await this.stackModel.findById(parseInt(id));
      if (!stack) {
        this.notFound(res, 'Stack');
        return;
      }

      await this.stackModel.removeEquipment(parseInt(id), parseInt(equipmentId));

      this.success(res, null, 'Equipment removed from stack successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const stack = await this.stackModel.findById(parseInt(id));
      if (!stack) {
        this.notFound(res, 'Stack');
        return;
      }

      // Проверить, используется ли стек в отгрузках
      const isUsedInShipments = await this.stackModel.isUsedInShipments(parseInt(id));
      if (isUsedInShipments) {
        this.error(res, 'Cannot delete stack. It is used in shipments.');
        return;
      }

      await this.stackModel.delete(parseInt(id));

      this.success(res, null, 'Stack deleted successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };
}
