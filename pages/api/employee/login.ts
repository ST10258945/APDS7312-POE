import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { issueSessionCookie } from '@/lib/session'
import { validateEmployeeId, validatePassword, /*validateIpAddress*/ } from '../../../lib/validation';

// Best effort IP extractor works locally and behind proxies / CDNs
function getClientIp(req: NextApiRequest): string {
  const xfwd = req.headers['x-forwarded-for'] as string | undefined; 
  const real = req.headers['x-real-ip'] as string | undefined;
  const verc = req.headers['x-vercel-ip'] as string | undefined;
  const raw  = req.socket?.remoteAddress;

  const firstForwarded = xfwd?.split(',')[0]?.trim();
  return firstForwarded || real || verc || raw || '127.0.0.1'; // safe fallback in dev
}


// Local IP validator (since lib/validation has no export for validateIpAddress)
function validateIpAddress(ip: string | undefined | null): boolean {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.0.0.1')) return true;
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


    const vEmp = validateEmployeeId(employeeId)
    // Validate all inputs using RegEx patterns
    if (!vEmp.isValid) {
      const clientIp = getClientIp(req)
      await prisma.auditLog.create({
        data: {
          entityType: 'Employee',
          entityId: 'unknown',
          action: 'EMPLOYEE_LOGIN_FAILED',
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ reason: vEmp.error })
        }
      });
      return res.status(400).json({ error: 'Invalid employee ID format' });
    }

    const sanitizedEmployeeId = vEmp.sanitized ?? employeeId

    const vPwd = validatePassword(password)
    if (!vPwd.isValid) {
      const clientIp = getClientIp(req)
      await prisma.auditLog.create({
        data: {
          entityType: 'Employee',
          entityId: 'unknown',
          action: 'EMPLOYEE_LOGIN_FAILED',
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ reason: vPwd.error })
        }
      });
      return res.status(400).json({ error: 'Invalid password format', details: vPwd.error });
    }

    // Validate IP address
    const clientIp = getClientIp(req);
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
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
  }

    // Find employee by employeeId
    const employee = await prisma.employee.findUnique({
      where: { employeeId: sanitizedEmployeeId }
    });

    if (!employee) {
      await prisma.auditLog.create({
        data: {
          entityType: 'Employee',
          entityId: 'unknown',
          action: 'EMPLOYEE_LOGIN_FAILED',
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
          metadata: JSON.stringify({ reason: `Employee not found: ${sanitizedEmployeeId}` })
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
          ipAddress: clientIp,
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

    issueSessionCookie(res, {
      sub: employee.id, 
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      type: 'employee'
    }, { expiresIn: '8h', maxAgeSeconds: 60 * 60 * 8 })


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

    // Log successful login
    await prisma.auditLog.create({
      data: {
        entityType: 'Employee',
        entityId: employee.id,
        action: 'EMPLOYEE_LOGIN_SUCCESS',
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({})
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

    const clientIp = getClientIp(req)
    await prisma.auditLog.create({
      data: {
        entityType: 'Employee',
        entityId: 'unknown',
        action: 'EMPLOYEE_LOGIN_ERROR',
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    });

    res.status(500).json({ error: 'Internal server error' });
  }
}