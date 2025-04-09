/**
 * Скрипт для тестирования обработки webhook'ов от Stripe
 * 
 * Этот скрипт эмулирует отправку webhook событий от Stripe для тестирования
 * нашего обработчика webhook'ов. Он использует встроенный HTTP-клиент Node.js
 * для отправки POST-запросов на локальный сервер.
 * 
 * Для использования:
 * 1. Запустите локальный сервер Next.js (npm run dev)
 * 2. В другом терминале выполните: node scripts/test-webhooks.js
 */

const http = require('http');
const crypto = require('crypto');

// Конфигурация
const config = {
  // URL вашего webhook эндпоинта
  webhookUrl: 'http://localhost:3000/api/payment/webhook',
  // Секретный ключ для подписи webhook событий (замените на тестовый ключ)
  webhookSecret: 'whsec_test_secret',
  // Базовый URL вашего приложения
  appUrl: 'http://localhost:3000',
};

// Тестовые данные для эмуляции пользователя и продукта
const testData = {
  userId: '123e4567-e89b-12d3-a456-426614174000', // Замените на реальный UUID пользователя из вашей БД
  customerEmail: 'test@example.com',
  priceId: 'price_basic_monthly',
  productId: 'prod_test123',
  subscriptionId: 'sub_' + Math.random().toString(36).substring(2, 15),
  paymentIntentId: 'pi_' + Math.random().toString(36).substring(2, 15),
  invoiceId: 'in_' + Math.random().toString(36).substring(2, 15),
};

// Генерирует уникальный ID для событий
function generateEventId() {
  return 'evt_' + Math.random().toString(36).substring(2, 15);
}

// Создает подпись для webhook события
function generateSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
    
  return `t=${timestamp},v1=${signature}`;
}

// Отправляет webhook событие
function sendWebhookEvent(eventType, eventData) {
  const eventId = generateEventId();
  
  const payload = JSON.stringify({
    id: eventId,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: eventData,
    },
    type: eventType,
    livemode: false,
  });
  
  const signature = generateSignature(payload, config.webhookSecret);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Stripe-Signature': signature,
    },
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(config.webhookUrl, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            response,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            response: data,
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(payload);
    req.end();
  });
}

// Создает тестовое событие checkout.session.completed
function createCheckoutSessionCompletedEvent() {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: 'cs_' + Math.random().toString(36).substring(2, 15),
    object: 'checkout.session',
    client_reference_id: testData.userId,
    customer: 'cus_' + Math.random().toString(36).substring(2, 12),
    customer_email: testData.customerEmail,
    subscription: testData.subscriptionId,
    payment_intent: testData.paymentIntentId,
    mode: 'subscription',
    payment_status: 'paid',
    status: 'complete',
    amount_total: 1990,
    currency: 'rub',
    created: now - 60,
    metadata: {},
  };
}

// Создает тестовое событие invoice.payment_succeeded
function createInvoicePaymentSucceededEvent() {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: testData.invoiceId,
    object: 'invoice',
    customer: 'cus_' + Math.random().toString(36).substring(2, 12),
    subscription: testData.subscriptionId,
    payment_intent: testData.paymentIntentId,
    status: 'paid',
    amount_paid: 1990,
    currency: 'rub',
    created: now - 60,
    period_start: now - 3600,
    period_end: now + 30 * 24 * 3600, // +30 дней
    hosted_invoice_url: 'https://invoice.stripe.com/test',
    invoice_pdf: 'https://invoice.stripe.com/test/pdf',
    default_payment_method: 'pm_card_visa',
  };
}

// Создает тестовое событие customer.subscription.updated
function createSubscriptionUpdatedEvent() {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: testData.subscriptionId,
    object: 'subscription',
    customer: 'cus_' + Math.random().toString(36).substring(2, 12),
    items: {
      data: [
        {
          price: {
            id: testData.priceId,
            product: testData.productId,
          },
        },
      ],
    },
    status: 'active',
    current_period_start: now,
    current_period_end: now + 30 * 24 * 3600, // +30 дней
    created: now - 3600,
  };
}

// Создает тестовое событие customer.subscription.deleted
function createSubscriptionDeletedEvent() {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: testData.subscriptionId,
    object: 'subscription',
    customer: 'cus_' + Math.random().toString(36).substring(2, 12),
    items: {
      data: [
        {
          price: {
            id: testData.priceId,
            product: testData.productId,
          },
        },
      ],
    },
    status: 'canceled',
    canceled_at: now,
    current_period_start: now - 30 * 24 * 3600,
    current_period_end: now - 1,
    created: now - 60 * 24 * 3600,
  };
}

// Тестирует все webhook события
async function testAllWebhooks() {
  console.log('🧪 Запуск тестирования webhook событий...\n');
  
  try {
    // Тест 1: checkout.session.completed
    console.log('🔄 Тест #1: checkout.session.completed');
    const checkoutEvent = createCheckoutSessionCompletedEvent();
    const checkoutResult = await sendWebhookEvent('checkout.session.completed', checkoutEvent);
    logResult('checkout.session.completed', checkoutResult);
    
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Тест 2: invoice.payment_succeeded
    console.log('\n🔄 Тест #2: invoice.payment_succeeded');
    const invoiceEvent = createInvoicePaymentSucceededEvent();
    const invoiceResult = await sendWebhookEvent('invoice.payment_succeeded', invoiceEvent);
    logResult('invoice.payment_succeeded', invoiceResult);
    
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Тест 3: customer.subscription.updated
    console.log('\n🔄 Тест #3: customer.subscription.updated');
    const subscriptionEvent = createSubscriptionUpdatedEvent();
    const subscriptionResult = await sendWebhookEvent('customer.subscription.updated', subscriptionEvent);
    logResult('customer.subscription.updated', subscriptionResult);
    
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Тест 4: customer.subscription.deleted
    console.log('\n🔄 Тест #4: customer.subscription.deleted');
    const deletedEvent = createSubscriptionDeletedEvent();
    const deletedResult = await sendWebhookEvent('customer.subscription.deleted', deletedEvent);
    logResult('customer.subscription.deleted', deletedResult);
    
    // Тест 5: Повторная отправка того же события (проверка идемпотентности)
    console.log('\n🔄 Тест #5: Проверка идемпотентности - повторная отправка checkout.session.completed');
    const duplicateResult = await sendWebhookEvent('checkout.session.completed', checkoutEvent);
    logResult('checkout.session.completed (повторно)', duplicateResult, true);
    
    console.log('\n✅ Тестирование webhook событий завершено.');
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании webhook событий:', error);
  }
}

// Логирует результат тестирования
function logResult(eventType, result, isDuplicate = false) {
  if (result.status >= 200 && result.status < 300) {
    console.log(`  ✓ ${eventType}: Успешно обработано (${result.status})`);
    
    if (isDuplicate && result.response && result.response.message === 'Duplicate event, already processed') {
      console.log('  ✓ Идемпотентность работает корректно: дубликат события корректно обработан');
    }
  } else {
    console.log(`  ✗ ${eventType}: Ошибка (${result.status})`);
    console.log('    Ответ:', result.response);
  }
}

// Запускаем тестирование
testAllWebhooks(); 