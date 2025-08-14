import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ShipmentModel } from '../models/ShipmentModel';
import { CreateShipment, UpdateShipment } from '../types/database';

export class ShipmentController extends BaseController {
  private shipmentModel = new ShipmentModel();

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, offset } = this.getPagination(req);
      const { search, status, date_from, date_to } = req.query;

      const result = await this.shipmentModel.findAll({
        page,
        limit,
        offset,
        search: search as string,
        status: status as string,
        date_from: date_from as string,
        date_to: date_to as string
      });

      this.successPaginated(res, result.data, result.pagination);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const shipment = await this.shipmentModel.findByIdWithDetails(parseInt(id));

      if (!shipment) {
        this.notFound(res, 'Shipment');
        return;
      }

      this.success(res, shipment);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const shipmentData: CreateShipment = req.body;
      const userId = (req as any).user?.userId;

      // Проверить уникальность номера отгрузки
      const existingShipment = await this.shipmentModel.findByNumber(shipmentData.number);
      if (existingShipment) {
        this.error(res, 'Shipment with this number already exists', 409);
        return;
      }

      const newShipment = await this.shipmentModel.create({
        ...shipmentData,
        created_by: userId
      });

      this.success(res, newShipment, 'Shipment created successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateShipment = req.body;

      // Проверить существование отгрузки
      const existingShipment = await this.shipmentModel.findById(parseInt(id));
      if (!existingShipment) {
        this.notFound(res, 'Shipment');
        return;
      }

      // Проверить уникальность номера (если он изменяется)
      if (updateData.number && updateData.number !== existingShipment.number) {
        const shipmentWithNumber = await this.shipmentModel.findByNumber(updateData.number);
        if (shipmentWithNumber) {
          this.error(res, 'Shipment with this number already exists', 409);
          return;
        }
      }

      const updatedShipment = await this.shipmentModel.update(parseInt(id), updateData);

      this.success(res, updatedShipment, 'Shipment updated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['preparing', 'in-transit', 'delivered', 'cancelled'].includes(status)) {
        this.error(res, 'Invalid status. Must be one of: preparing, in-transit, delivered, cancelled');
        return;
      }

      const shipment = await this.shipmentModel.findById(parseInt(id));
      if (!shipment) {
        this.notFound(res, 'Shipment');
        return;
      }

      const updateData: any = { status };
      
      // Если статус "delivered", установить дату доставки
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const updatedShipment = await this.shipmentModel.update(parseInt(id), updateData);

      this.success(res, updatedShipment, 'Shipment status updated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public addChecklistItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, description, is_required = true } = req.body;

      const shipment = await this.shipmentModel.findById(parseInt(id));
      if (!shipment) {
        this.notFound(res, 'Shipment');
        return;
      }

      const checklistItem = await this.shipmentModel.addChecklistItem(parseInt(id), {
        title,
        description,
        is_required
      });

      this.success(res, checklistItem, 'Checklist item added successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public updateChecklistItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, itemId } = req.params;
      const { title, description, is_completed, is_required, completed_by } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (is_required !== undefined) updateData.is_required = is_required;
      if (completed_by !== undefined) updateData.completed_by = completed_by;

      if (is_completed !== undefined) {
        updateData.is_completed = is_completed;
        if (is_completed) {
          updateData.completed_at = new Date().toISOString();
          if (!completed_by) {
            updateData.completed_by = (req as any).user?.username || 'System';
          }
        } else {
          updateData.completed_at = null;
          updateData.completed_by = null;
        }
      }

      const updatedItem = await this.shipmentModel.updateChecklistItem(parseInt(itemId), updateData);

      this.success(res, updatedItem, 'Checklist item updated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public deleteChecklistItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { itemId } = req.params;

      await this.shipmentModel.deleteChecklistItem(parseInt(itemId));

      this.success(res, null, 'Checklist item deleted successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public addRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { equipment_name, quantity, link } = req.body;

      const shipment = await this.shipmentModel.findById(parseInt(id));
      if (!shipment) {
        this.notFound(res, 'Shipment');
        return;
      }

      const rental = await this.shipmentModel.addRental(parseInt(id), {
        equipment_name,
        quantity,
        link
      });

      this.success(res, rental, 'Rental item added successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public updateRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rentalId } = req.params;
      const { equipment_name, quantity, link } = req.body;

      const updateData: any = {};
      if (equipment_name !== undefined) updateData.equipment_name = equipment_name;
      if (quantity !== undefined) updateData.quantity = quantity;
      if (link !== undefined) updateData.link = link;

      const updatedRental = await this.shipmentModel.updateRental(parseInt(rentalId), updateData);

      this.success(res, updatedRental, 'Rental item updated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public deleteRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rentalId } = req.params;

      await this.shipmentModel.deleteRental(parseInt(rentalId));

      this.success(res, null, 'Rental item deleted successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const shipment = await this.shipmentModel.findById(parseInt(id));
      if (!shipment) {
        this.notFound(res, 'Shipment');
        return;
      }

      await this.shipmentModel.delete(parseInt(id));

      this.success(res, null, 'Shipment deleted successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };
}
