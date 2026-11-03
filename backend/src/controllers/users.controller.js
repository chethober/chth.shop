const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { serializeUser } = require('../lib/serializers');

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{5,}$/;

const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { store: true },
  });
  if (!user) throw new HttpError(404, 'User not found');

  sendSuccess(res, { data: { user: serializeUser(user) } });
});

/** Reports whether a username can be claimed by the current user. */
const checkUsername = asyncHandler(async (req, res) => {
  const username = String(req.query.username || '');
  if (!USERNAME_PATTERN.test(username)) {
    return sendSuccess(res, { data: { available: false } });
  }

  const owner = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  sendSuccess(res, { data: { available: !owner || owner.id === req.userId } });
});

/** Deletes the account; store, products, cart and orders cascade in the database. */
const deleteMe = asyncHandler(async (req, res) => {
  await prisma.user.delete({ where: { id: req.userId } });
  sendSuccess(res, { message: 'Account deleted successfully' });
});

module.exports = { getMe, checkUsername, deleteMe };
