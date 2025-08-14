import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { LocationModel } from '../models/LocationModel';
import { CreateLocation } from '../types/database';

export class LocationController extends BaseController {
  private locationModel = new LocationModel();

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, offset } = this.getPagination(req);
      const { search } = req.query;

      const result = await this.locationModel.findAll({
        page,
        limit,
        offset,
        search: search as string
      });

      this.successPaginated(res, result.data, result.pagination);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const location = await this.locationModel.findById(parseInt(id));

      if (!location) {
        this.notFound(res, 'Location');
        return;
      }

      this.success(res, location);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const locationData: CreateLocation = req.body;

      // Проверить уникальность названия
      const existingLocation = await this.locationModel.findByName(locationData.name);
      if (existingLocation) {
        this.error(res, 'Location with this name already exists', 409);
        return;
      }

      const newLocation = await this.locationModel.create(locationData);

      this.success(res, newLocation, 'Location created successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: Partial<CreateLocation> = req.body;

      // Проверить существование локации
      const existingLocation = await this.locationModel.findById(parseInt(id));
      if (!existingLocation) {
        this.notFound(res, 'Location');
        return;
      }

      // Проверить уникальность названия (если оно изменяется)
      if (updateData.name && updateData.name !== existingLocation.name) {
        const locationWithName = await this.locationModel.findByName(updateData.name);
        if (locationWithName) {
          this.error(res, 'Location with this name already exists', 409);
          return;
        }
      }

      const updatedLocation = await this.locationModel.update(parseInt(id), updateData);

      this.success(res, updatedLocation, 'Location updated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const location = await this.locationModel.findById(parseInt(id));
      if (!location) {
        this.notFound(res, 'Location');
        return;
      }

      // Проверить, используется ли локация в оборудовании
      const equipmentCount = await this.locationModel.getEquipmentCount(parseInt(id));
      if (equipmentCount > 0) {
        this.error(res, `Cannot delete location. It is used by ${equipmentCount} equipment items.`);
        return;
      }

      await this.locationModel.delete(parseInt(id));

      this.success(res, null, 'Location deleted successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };
}
