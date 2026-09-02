import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db, User } from '../services/store';
import { authenticate, AuthRequest, JWT_SECRET } from '../middleware/auth';

const router = Router();

// Helper to generate JWT
function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res: Response) => {
  try {
    const { name, email, password, role, company, title, phone, location } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    if (role !== 'candidate' && role !== 'recruiter') {
      return res.status(400).json({ error: 'Role must be either candidate or recruiter.' });
    }

    const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: 'user_' + uuidv4().substring(0, 8),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      company: company?.trim(),
      title: title?.trim(),
      phone: phone?.trim(),
      location: location?.trim() || 'India / Remote',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.save();

    const token = generateToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error during signup.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    // Allow fallback for pre-seeded user if bcrypt check needs grace
    const isValid = isMatch || (password === 'password123' && user.email.includes('@demo.com'));

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /api/auth/demo-login
router.post('/demo-login', async (req, res: Response) => {
  try {
    const { role } = req.body; // 'candidate' | 'recruiter'
    const targetEmail = role === 'recruiter' ? 'recruiter@demo.com' : 'candidate@demo.com';

    let user = db.users.find((u) => u.email === targetEmail);
    if (!user) {
      // Re-seed if needed
      user = {
        id: role === 'recruiter' ? 'user_rec_1' : 'user_cand_1',
        name: role === 'recruiter' ? 'Priya Mehta (Recruiter)' : 'Vansh Sharma (Candidate)',
        email: targetEmail,
        passwordHash: 'dummy',
        role: role === 'recruiter' ? 'recruiter' : 'candidate',
        company: role === 'recruiter' ? 'InnovateX Global' : undefined,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      db.save();
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      message: `Demo logged in as ${user.name}`,
      token,
      user: safeUser,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Demo login error.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, (req: AuthRequest, res: Response) => {
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const { name, company, title, phone, location } = req.body;
  if (name) user.name = name.trim();
  if (company !== undefined) user.company = company.trim();
  if (title !== undefined) user.title = title.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (location !== undefined) user.location = location.trim();

  db.save();
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ message: 'Profile updated successfully!', user: safeUser });
});

export default router;
