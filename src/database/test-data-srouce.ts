import { config } from 'dotenv';

import { createDataSource } from './data-source.factory';

config({ path: '.env.local' }); // .env.local because .env is used in docker-compose and it confuses database host

const testDataSource = createDataSource(process.env.TEST_DB_NAME);

export default testDataSource;
