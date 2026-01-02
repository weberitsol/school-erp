import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { jwtConfig, passwordConfig } from '../config/jwt.config';
import { UserRole } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
  schoolId: string;
  profileData: any;
}

interface LoginData {
  email: string;
  password: string;
}

interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  schoolId: string;
}

class AuthService {
  // Generate access token
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  // Generate refresh token
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, passwordConfig.saltRounds);
  }

  // Compare password
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Register new user
  async register(data: RegisterData) {
    const { email, password, role, schoolId, profileData } = data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user with profile based on role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        schoolId,
        ...(role === 'STUDENT' && {
          student: {
            create: {
              admissionNo: profileData.admissionNo,
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              dateOfBirth: new Date(profileData.dateOfBirth),
              gender: profileData.gender,
              phone: profileData.phone,
              address: profileData.address,
            },
          },
        }),
        ...(role === 'TEACHER' && {
          teacher: {
            create: {
              employeeId: profileData.employeeId,
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              gender: profileData.gender,
              phone: profileData.phone,
              qualification: profileData.qualification,
            },
          },
        }),
        ...(role === 'PARENT' && {
          parent: {
            create: {
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              relation: profileData.relation,
              phone: profileData.phone,
            },
          },
        }),
        ...(role === 'ADMIN' && {
          admin: {
            create: {
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              phone: profileData.phone,
              designation: profileData.designation,
            },
          },
        }),
      },
      include: {
        student: true,
        teacher: true,
        parent: true,
        admin: true,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  // Login user
  async login(data: LoginData) {
    const { email, password } = data;

    // Find user with profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        teacher: true,
        parent: true,
        admin: true,
        school: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Please contact admin.', 401);
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Update refresh token and last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLogin: new Date(),
      },
    });

    // Get profile based on role
    let profile = null;
    switch (user.role) {
      case 'STUDENT':
        profile = user.student;
        break;
      case 'TEACHER':
        profile = user.teacher;
        break;
      case 'PARENT':
        profile = user.parent;
        break;
      case 'ADMIN':
      case 'SUPER_ADMIN':
        profile = user.admin;
        break;
    }

    // Remove sensitive data
    const { password: _, refreshToken: __, ...userData } = user;

    return {
      user: {
        ...userData,
        profile,
      },
      accessToken,
      refreshToken,
    };
  }

  // Refresh access token
  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, jwtConfig.refreshSecret) as TokenPayload;

      // Verify user exists and token matches
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.refreshToken !== token) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new access token
      const tokenPayload: TokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      };

      const accessToken = this.generateAccessToken(tokenPayload);

      return { accessToken };
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  // Logout
  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValidPassword = await this.comparePassword(currentPassword, user.password);

    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 400);
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  // Update FCM token for push notifications
  async updateFcmToken(userId: string, fcmToken: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    return { message: 'FCM token updated successfully' };
  }
}

export default new AuthService();
