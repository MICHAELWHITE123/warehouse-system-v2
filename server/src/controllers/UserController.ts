import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { BaseController } from './BaseController';
import { UserModel } from '../models/UserModel';
import { CreateUser, UpdateUser } from '../types/database';

export class UserController extends BaseController {
  private userModel = new UserModel();

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, offset } = this.getPagination(req);
      const { search, role, is_active } = req.query;

      const result = await this.userModel.findAll({
        page,
        limit,
        offset,
        search: search as string,
        role: role as string,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined
      });

      // Убрать пароли из ответа
      const usersWithoutPasswords = result.data.map(user => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      this.successPaginated(res, usersWithoutPasswords, result.pagination);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.userId;
      const currentUserRole = (req as any).user?.role;

      // Проверить права доступа: пользователь может видеть только себя, админы и менеджеры - всех
      if (currentUserRole !== 'admin' && currentUserRole !== 'manager' && currentUserId !== parseInt(id)) {
        this.forbidden(res, 'You can only view your own profile');
        return;
      }

      const user = await this.userModel.findById(parseInt(id));

      if (!user) {
        this.notFound(res, 'User');
        return;
      }

      // Убрать пароль из ответа
      const { password_hash, ...userWithoutPassword } = user;

      this.success(res, userWithoutPassword);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: CreateUser = req.body;

      // Проверить, что пользователь с таким username/email не существует
      const existingUser = await this.userModel.findByUsernameOrEmail(userData.username);
      if (existingUser) {
        this.error(res, 'User with this username already exists', 409);
        return;
      }

      const existingEmail = await this.userModel.findByUsernameOrEmail(userData.email);
      if (existingEmail) {
        this.error(res, 'User with this email already exists', 409);
        return;
      }

      // Хешировать пароль
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Создать пользователя
      const newUser = await this.userModel.create({
        ...userData,
        password: passwordHash
      });

      // Убрать пароль из ответа
      const { password_hash, ...userWithoutPassword } = newUser;

      this.success(res, userWithoutPassword, 'User created successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateUser = req.body;
      const currentUserId = (req as any).user?.userId;
      const currentUserRole = (req as any).user?.role;

      // Проверить права доступа
      if (currentUserRole !== 'admin' && currentUserId !== parseInt(id)) {
        this.forbidden(res, 'You can only update your own profile');
        return;
      }

      // Запретить обычным пользователям менять роль
      if (currentUserRole !== 'admin' && updateData.role) {
        this.forbidden(res, 'You cannot change user roles');
        return;
      }

      // Проверить существование пользователя
      const existingUser = await this.userModel.findById(parseInt(id));
      if (!existingUser) {
        this.notFound(res, 'User');
        return;
      }

      // Проверить уникальность username и email (если они изменяются)
      if (updateData.username && updateData.username !== existingUser.username) {
        const userWithUsername = await this.userModel.findByUsernameOrEmail(updateData.username);
        if (userWithUsername) {
          this.error(res, 'Username already taken', 409);
          return;
        }
      }

      if (updateData.email && updateData.email !== existingUser.email) {
        const userWithEmail = await this.userModel.findByUsernameOrEmail(updateData.email);
        if (userWithEmail) {
          this.error(res, 'Email already taken', 409);
          return;
        }
      }

      // Хешировать пароль, если он предоставлен
      let finalUpdateData = { ...updateData };
      if (updateData.password) {
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(updateData.password, saltRounds);
        finalUpdateData = { ...updateData, password: passwordHash };
      }

      const updatedUser = await this.userModel.update(parseInt(id), finalUpdateData);

      // Убрать пароль из ответа
      const { password_hash, ...userWithoutPassword } = updatedUser;

      this.success(res, userWithoutPassword, 'User updated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.userId;

      // Запретить пользователям удалять самих себя
      if (currentUserId === parseInt(id)) {
        this.error(res, 'You cannot delete your own account');
        return;
      }

      const user = await this.userModel.findById(parseInt(id));
      if (!user) {
        this.notFound(res, 'User');
        return;
      }

      await this.userModel.delete(parseInt(id));

      this.success(res, null, 'User deleted successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };
}
