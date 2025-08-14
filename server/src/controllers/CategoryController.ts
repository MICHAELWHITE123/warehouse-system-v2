import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CategoryModel } from '../models/CategoryModel';
import { CreateCategory } from '../types/database';

export class CategoryController extends BaseController {
  private categoryModel = new CategoryModel();

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, offset } = this.getPagination(req);
      const { search } = req.query;

      const result = await this.categoryModel.findAll({
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

      const category = await this.categoryModel.findById(parseInt(id));

      if (!category) {
        this.notFound(res, 'Category');
        return;
      }

      this.success(res, category);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryData: CreateCategory = req.body;

      // Проверить уникальность названия
      const existingCategory = await this.categoryModel.findByName(categoryData.name);
      if (existingCategory) {
        this.error(res, 'Category with this name already exists', 409);
        return;
      }

      const newCategory = await this.categoryModel.create(categoryData);

      this.success(res, newCategory, 'Category created successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: Partial<CreateCategory> = req.body;

      // Проверить существование категории
      const existingCategory = await this.categoryModel.findById(parseInt(id));
      if (!existingCategory) {
        this.notFound(res, 'Category');
        return;
      }

      // Проверить уникальность названия (если оно изменяется)
      if (updateData.name && updateData.name !== existingCategory.name) {
        const categoryWithName = await this.categoryModel.findByName(updateData.name);
        if (categoryWithName) {
          this.error(res, 'Category with this name already exists', 409);
          return;
        }
      }

      const updatedCategory = await this.categoryModel.update(parseInt(id), updateData);

      this.success(res, updatedCategory, 'Category updated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const category = await this.categoryModel.findById(parseInt(id));
      if (!category) {
        this.notFound(res, 'Category');
        return;
      }

      // Проверить, используется ли категория в оборудовании
      const equipmentCount = await this.categoryModel.getEquipmentCount(parseInt(id));
      if (equipmentCount > 0) {
        this.error(res, `Cannot delete category. It is used by ${equipmentCount} equipment items.`);
        return;
      }

      await this.categoryModel.delete(parseInt(id));

      this.success(res, null, 'Category deleted successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };
}
