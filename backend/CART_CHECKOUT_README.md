# Cart and Checkout Functionality

This document describes the cart and checkout system implemented for the merchandise platform.

## Database Schema

### New Models Added

#### Cart
- `id`: Unique identifier
- `userId`: Reference to user (one-to-one relationship)
- `items`: Cart items (one-to-many relationship)
- `createdAt`, `updatedAt`: Timestamps

#### CartItem
- `id`: Unique identifier
- `cartId`: Reference to cart
- `productId`: Reference to product
- `quantity`: Item quantity (default: 1)
- `createdAt`, `updatedAt`: Timestamps
- Unique constraint on `[cartId, productId]`

#### Order
- `id`: Unique identifier
- `userId`: Reference to user
- `status`: Order status (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
- `total`: Order total amount
- `shippingAddress`: Customer shipping address
- `items`: Order items (one-to-many relationship)
- `createdAt`, `updatedAt`: Timestamps

#### OrderItem
- `id`: Unique identifier
- `orderId`: Reference to order
- `productId`: Reference to product
- `quantity`: Item quantity
- `price`: Price at time of purchase
- `createdAt`, `updatedAt`: Timestamps

## API Endpoints

### Cart Routes (`/api/cart`)

All cart routes require authentication.

#### GET `/api/cart`
- Get user's current cart with all items
- Creates cart if it doesn't exist
- Returns cart items with product and artist information

#### POST `/api/cart/add`
- Add product to cart
- Body: `{ productId, quantity }`
- If product already exists, increases quantity
- Returns updated cart item

#### PUT `/api/cart/items/:itemId`
- Update cart item quantity
- Body: `{ quantity }`
- Returns updated cart item

#### DELETE `/api/cart/items/:itemId`
- Remove item from cart
- Returns success message

#### DELETE `/api/cart/clear`
- Clear all items from cart
- Returns success message

### Order Routes (`/api/orders`)

All order routes require authentication.

#### POST `/api/orders/checkout`
- Create order from current cart
- Body: `{ shippingAddress }`
- Creates order, order items, and clears cart
- Returns created order details

#### GET `/api/orders`
- Get user's order history
- Returns all orders with items and product details

#### GET `/api/orders/:orderId`
- Get specific order details
- Returns order with items and product information

#### PUT `/api/orders/:orderId/cancel`
- Cancel pending order
- Only PENDING orders can be cancelled
- Returns updated order status

## Features

### Cart Management
- **Automatic Cart Creation**: Cart is created automatically when user first adds an item
- **Quantity Management**: Users can update quantities or remove items
- **Duplicate Prevention**: Same product increases quantity instead of creating duplicate entries
- **Real-time Totals**: Cart calculates total items and total price

### Checkout Process
- **Cart to Order**: Seamless conversion from cart to order
- **Transaction Safety**: Uses database transactions for data integrity
- **Cart Clearing**: Cart is automatically cleared after successful order creation
- **Address Required**: Shipping address is required for checkout

### Order Management
- **Status Tracking**: Orders have multiple statuses (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
- **Order History**: Users can view all their past orders
- **Order Details**: Full order information including products, artists, and pricing
- **Cancellation**: Pending orders can be cancelled

## Usage Examples

### Adding to Cart
```javascript
const response = await fetch('/api/cart/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    productId: 123,
    quantity: 2
  })
});
```

### Checkout
```javascript
const response = await fetch('/api/orders/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    shippingAddress: '123 Main St, City, State 12345'
  })
});
```

### Getting Cart
```javascript
const response = await fetch('/api/cart', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { cart } = await response.json();
```

## Security Features

- **Authentication Required**: All cart and order operations require valid JWT token
- **User Isolation**: Users can only access their own cart and orders
- **Input Validation**: All inputs are validated before processing
- **SQL Injection Protection**: Uses Prisma ORM for safe database queries

## Database Relationships

```
User (1) ←→ (1) Cart
Cart (1) ←→ (many) CartItem
CartItem (many) ←→ (1) Product
User (1) ←→ (many) Order
Order (1) ←→ (many) OrderItem
OrderItem (many) ←→ (1) Product
Product (many) ←→ (1) Artist
Artist (1) ←→ (1) User
```

## Migration

To add these tables to an existing database:

1. Run the migration script:
   ```bash
   node scripts/migrate-cart-orders.js
   ```

2. Or manually run Prisma migration:
   ```bash
   npx prisma migrate dev --name add_cart_orders
   ```

## Future Enhancements

- **Payment Integration**: Stripe, PayPal, etc.
- **Inventory Management**: Stock tracking and low stock alerts
- **Shipping Options**: Multiple shipping methods and costs
- **Order Notifications**: Email/SMS updates for order status
- **Returns/Refunds**: Return policy and refund processing
- **Discount Codes**: Coupon and promotion system 