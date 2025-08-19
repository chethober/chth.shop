const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'merch_platform',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 30],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  isArtist: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Artist Model
const Artist = sequelize.define('Artist', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  storeName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  contractAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  contractAcceptedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'artists',
  timestamps: true
});

// Product Model
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  type: {
    type: DataTypes.ENUM('tshirt', 'hoodie', 'pants'),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  artistId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Artist,
      key: 'id'
    }
  },
  customization: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products',
  timestamps: true
});

// Define associations
User.hasOne(Artist, {
  foreignKey: 'userId',
  as: 'artistProfile'
});

Artist.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Artist.hasMany(Product, {
  foreignKey: 'artistId',
  as: 'products'
});

Product.belongsTo(Artist, {
  foreignKey: 'artistId',
  as: 'artist'
});

// Initialize database
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync all models
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');

    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  User,
  Artist,
  Product,
  initializeDatabase
};
