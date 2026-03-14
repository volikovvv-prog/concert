export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL ?? 'testuser@example.com',
  password: process.env.TEST_USER_PASSWORD ?? 'TestPass123!',
  name: 'Test User',
  phone: '+380501234567',
};

export const INVALID_USER = {
  email: 'wrong@example.com',
  password: 'WrongPassword!',
};

export const NEW_USER = {
  email: `test+${Date.now()}@example.com`,
  password: 'NewUser123!',
  name: 'New Test User',
};

export const CARDS = {
  valid: {
    number: '4111 1111 1111 1111',
    expiry: '12/28',
    cvv: '123',
    name: 'Test User',
  },
  invalid: {
    number: '1111 1111 1111 1111',
    expiry: '01/20',
    cvv: '999',
  },
  expired: {
    number: '4111 1111 1111 1111',
    expiry: '01/20',
    cvv: '123',
  },
  insufficientFunds: {
    number: '4000 0000 0000 9995',
    expiry: '12/28',
    cvv: '123',
  },
};

export const PROMO = {
  valid: process.env.VALID_PROMO_CODE ?? 'TESTDISCOUNT10',
  invalid: 'INVALIDCODE999',
  expired: 'EXPIREDPROMO',
};

export const CITIES = {
  kyiv: 'Київ',
  lviv: 'Львів',
  odesa: 'Одеса',
};

export const BASE_URL = 'https://concert.ua';

export const INVALID_EMAIL_FORMATS = [
  'test@',
  'user@domain',
  '@nodomain.com',
  'plaintext',
  'missing@.com',
];

export const INVALID_PHONE_FORMATS = [
  '123',
  'abcdefghij',
  '+380',
];

export const XSS_PAYLOAD = '<script>alert(1)</script>';
export const HTML_INJECT_PAYLOAD = '<h1>Injected</h1>';

export const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};
