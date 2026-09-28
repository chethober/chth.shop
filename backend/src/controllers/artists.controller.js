const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { artistWithUser } = require('../lib/queries');

const PROFILE_FIELDS = [
  'bio',
  'storeName',
  'instagram',
  'twitter',
  'tiktok',
  'youtube',
  'spotify',
  'telegram',
  'discord',
  'website',
];

function pickProfileFields(body) {
  return Object.fromEntries(PROFILE_FIELDS.map((field) => [field, body[field]]));
}

const listArtists = asyncHandler(async (req, res) => {
  const artists = await prisma.artist.findMany({
    include: {
      user: { select: { username: true } },
      products: { take: 3, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { data: { artists } });
});

const getArtistByUsername = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    include: {
      artist: {
        include: {
          ...artistWithUser.include,
          products: { orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });
  if (!user || !user.artist) throw new HttpError(404, 'Artist not found');

  sendSuccess(res, { data: { artist: user.artist, products: user.artist.products } });
});

const getMyProfile = asyncHandler(async (req, res) => {
  const artist = await prisma.artist.findUnique({
    where: { userId: req.userId },
    ...artistWithUser,
  });
  if (!artist) throw new HttpError(404, 'Artist profile not found');

  sendSuccess(res, { data: { artist } });
});

const createProfile = asyncHandler(async (req, res) => {
  const existing = await prisma.artist.findUnique({ where: { userId: req.userId } });
  if (existing) throw new HttpError(400, 'Artist profile already exists');
  if (!req.body.storeName) throw new HttpError(400, 'Store name is required');

  const [artist] = await prisma.$transaction([
    prisma.artist.create({
      data: { userId: req.userId, ...pickProfileFields(req.body) },
      ...artistWithUser,
    }),
    prisma.user.update({ where: { id: req.userId }, data: { isArtist: true } }),
  ]);

  sendSuccess(res, { status: 201, message: 'Artist profile created successfully', data: { artist } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const existing = await prisma.artist.findUnique({ where: { userId: req.userId } });
  if (!existing) throw new HttpError(404, 'Artist profile not found');

  const artist = await prisma.artist.update({
    where: { userId: req.userId },
    data: pickProfileFields(req.body),
    ...artistWithUser,
  });

  sendSuccess(res, { message: 'Artist profile updated successfully', data: { artist } });
});

const deleteProfile = asyncHandler(async (req, res) => {
  const artist = await prisma.artist.findUnique({ where: { userId: req.userId } });
  if (!artist) throw new HttpError(404, 'Artist profile not found');

  await prisma.$transaction([
    prisma.artist.delete({ where: { id: artist.id } }),
    prisma.user.update({ where: { id: req.userId }, data: { isArtist: false } }),
  ]);

  sendSuccess(res, { message: 'Artist profile deleted successfully' });
});

/** Joins the artist program, creating a default storefront if needed. */
const acceptContract = asyncHandler(async (req, res) => {
  const artist = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: req.userId }, data: { isArtist: true } });
    const existing = await tx.artist.findUnique({ where: { userId: req.userId }, ...artistWithUser });
    if (existing) return existing;

    return tx.artist.create({
      data: {
        userId: req.userId,
        storeName: `${user.username}'s Store`,
        bio: 'CHTH Collaborative Artist',
      },
      ...artistWithUser,
    });
  });

  sendSuccess(res, { message: 'Contract accepted successfully', data: { artist } });
});

module.exports = {
  listArtists,
  getArtistByUsername,
  getMyProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  acceptContract,
};
