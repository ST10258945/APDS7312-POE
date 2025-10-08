import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validateEmployeeId, validatePassword, validateIpAddress } from '../../../lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeId, password } = req.body;

    // Validate all inputs using RegEx patterns
    if (!validateEmployeeId(employeeId)) {
      await prisma.auditLog.create({
        data: {
          action: 'EMPLOYEE_LOGIN_FAILED',
          details: 'Invalid employee ID format',
          ipAddress: req.socket.remoteAddress || 'unknown',
          timestamp: new Date(),
          severity: 'MEDIUM'
        }
      });
      return res.status(400).json({ error: 'Invalid employee ID format' });
    }

    if (!validatePassword(password)) {
      await prisma.auditLog.create({
        data: {
          action: 'EMPLOYEE_LOGIN_FAILED',
          details: 'Invalid password format',
          ipAddress: req.socket.remoteAddress || 'unknown',
          timestamp: new Date(),
          severity: 'MEDIUM'
        }
      });
      return res.status(400).json({ error: 'Invalid password format' });
    }

    // Validate IP address
    const clientIp = req.socket.remoteAddress || '';
    if (!validateIpAddress(clientIp)) {
      await prisma.auditLog.create({
        data: {
          action: 'EMPLOYEE_LOGIN_BLOCKED',
          details: 'Invalid IP address format',
          ipAddress: clientIp,
          timestamp: new Date(),
          severity: 'HIGH'
        }
      });
      return res.status(400).json({ error: 'Invalid request source' });
    }

    // Find employee by employeeId
    const employee = await prisma.employee.findUnique({
      where: { employeeId: employeeId }
    });

    if (!employee) {
      await prisma.auditLog.create({
        data: {
          action: 'EMPLOYEE_LOGIN_FAILED',
          details: `Employee not found: ${employeeId}`,
          ipAddress: clientIp,
          timestamp: new Date(),
          severity: 'MEDIUM'
        }
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if employee is active
    if (!employee.isActive) {
      await prisma.auditLog.create({
        data: {
          action: 'EMPLOYEE_LOGIN_BLOCKED',
          details: `Inactive employee login attempt: ${employeeId}`,
          ipAddress: clientIp,
          timestamp: new Date(),
          severity: 'HIGH'
        }
      });
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, employee.passwordHash);
    
    if (!isValidPassword) {
      // Increment failed login attempts
      await prisma.employee.update({
        where: { id: employee.id },
        data: { 
          failedLoginAttempts: employee.failedLoginAttempts + 1,
          lastFailedLogin: new Date()
        }
      });

      await prisma.auditLog.create({
        data: {
          action: 'EMPLOYEE_LOGIN_FAILED',
          details: `Invalid password for employee: ${employeeId}`,
          ipAddress: clientIp,
          timestamp: new Date(),
          severity: 'MEDIUM'
        }
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked due to failed attempts
    if (employee.failedLoginAttempts >= 5) {
      await prisma.auditLog.create({
        data: {
          action: 'EMPLOYEE_LOGIN_BLOCKED',
          details: `Account locked due to failed attempts: ${employeeId}`,
          ipAddress: clientIp,
          timestamp: new Date(),
          severity: 'HIGH'
        }
      });
      return res.status(401).json({ error: 'Account locked due to multiple failed attempts' });
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { 
        employeeId: employee.employeeId,
        role: employee.role,
        fullName: employee.fullName,
        type: 'employee'
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Employee sessions expire in 8 hours
    );

    // Reset failed login attempts on successful login
    await prisma.employee.update({
      where: { id: employee.id },
      data: { 
        failedLoginAttempts: 0,
        lastLogin: new Date(),
        lastFailedLogin: null
      }
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        action: 'EMPLOYEE_LOGIN_SUCCESS',
        details: `Employee ${employeeId} logged in successfully`,
        ipAddress: clientIp,
        timestamp: new Date(),
        severity: 'LOW'
      }
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      employee: {
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        role: employee.role,
        department: employee.department
      }
    });

  } catch (error) {
    console.error('Employee login error:', error);
    
    await prisma.auditLog.create({
      data: {
        action: 'EMPLOYEE_LOGIN_ERROR',
        details: `System error during employee login: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ipAddress: req.socket.remoteAddress || 'unknown',
        timestamp: new Date(),
        severity: 'HIGH'
      }
    });

    res.status(500).json({ error: 'Internal server error' });
  }
}