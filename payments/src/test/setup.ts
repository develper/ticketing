import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

process.env.STRIPE_KEY =
  'sk_test_51IPLsCIQRR4TErP4c2kDebIEncNHxe66zI8ETLpJDwfZQ3g5R7shhNUfztWWsU3UvK3afMG10T7FhJE4NQ1z2TTO00KfRES77f';

declare global {
  namespace NodeJS {
    interface Global {
      signup(id?: string): string[];
    }
  }
}

jest.mock('../nats-wrapper');

let mongo: any;
beforeAll(async () => {
  process.env.JWT_KEY = 'asdf';
  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

global.signup = (id?: string) => {
  // Build a JWT Payload
  const payload = {
    id: id || new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com'
  };

  // Create a JWT
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // Build a session object
  const session = { jwt: token };

  // Turn Session into JSON
  const sessionJSON = JSON.stringify(session);

  // Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');

  return [`express:sess=${base64}`];
};
