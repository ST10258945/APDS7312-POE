import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { validateEmployeeId, validatePassword, /*validateIpAddress*/ } from '../../../lib/validation';

// Local IP validator (since lib/validation has no export for validateIpAddress)
function validateIpAddress(ip: string | undefined | null): boolean {
  if (!ip) return false
  // Accept IPv4 or IPv6 (simple checks)
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)
  const ipv6 = /^[0-9a-fA-F:]+$/.test(ip)
  return ipv4 || ipv6
}

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
          entityType: 'Employee',
          entityId: 'unknown',
          action: 'EMPLOYEE_LOGIN_FAILED',
          ipAddress: req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ reason: 'Invalid employee ID format' })
        }
      });
      return res.status(400).json({ error: 'Invalid employee ID format' });
    }

    if (!validatePassword(password)) {
      await prisma.auditLog.create({
        data: {
          entityType: 'Employee',
          entityId: 'unknown',
          action: 'EMPLOYEE_LOGIN_FAILED',
          ipAddress: req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ reason: 'Invalid password format' })
        }
      });
      return res.status(400).json({ error: 'Invalid password format' });
    }

    // Validate IP address
    const clientIp = req.socket.remoteAddress || '';
    if (!validateIpAddress(clientIp)) {
      await prisma.auditLog.create({
        data: {
          entityType: 'Employee',
          entityId: 'unknown',
          action: 'EMPLOYEE_LOGIN_BLOCKED',
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ reason: 'Invalid IP address format' })
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
          entityType: 'Employee',
          entityId: 'unknown',
          action: 'EMPLOYEE_LOGIN_FAILED',
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ reason: `Employee not found: ${employeeId}` })
        }
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if employee is active
    if (!employee.isActive) {
      await prisma.auditLog.create({
        data: {
          entityType: 'Employee',
          entityId: employee.id,
          action: 'EMPLOYEE_LOGIN_BLOCKED',
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ reason: 'Inactive employee' })
        }
      });
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, employee.passwordHash);
    
    if (!isValidPassword) {
      await prisma.auditLog.create({
        data: {
          entityType: 'Employee',
          entityId: 'unknown',
          action: 'EMPLOYEE_LOGIN_FAILED',
          ipAddress: req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ reason: 'Invalid password format' })
        }
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    /*
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
      */

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { 
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        type: 'employee'
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Employee sessions expire in 8 hours
    );

    /*
    // Reset failed login attempts on successful login
    await prisma.employee.update({
      where: { id: employee.id },
      data: { 
        failedLoginAttempts: 0,
        lastLogin: new Date(),
        lastFailedLogin: null
      }
    });
    */

    const isProd = process.env.NODE_ENV === 'production'

    // Set HttpOnly session cookie
    res.setHeader('Set-Cookie', serialize('session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours for employees
    }))

    // Log successful login
    await prisma.auditLog.create({
      data: {
        entityType: 'Employee',
        entityId: employee.id,
        action: 'EMPLOYEE_LOGIN_SUCCESS',
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({ })
      }
    });

    // Do NOT return token in body
    res.status(200).json({
      message: 'Login successful',
      employee: {
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email
      }
    });

  } catch (error) {
    console.error('Employee login error:', error);
    
    await prisma.auditLog.create({
      data: {
        entityType: 'Employee',
        entityId: 'unknown',
        action: 'EMPLOYEE_LOGIN_ERROR',
        ipAddress: req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    });

    res.status(500).json({ error: 'Internal server error' });
  }
}