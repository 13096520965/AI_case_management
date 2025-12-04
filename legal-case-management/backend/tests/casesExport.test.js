const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

const token = jwt.sign({ userId: 1, username: 'testuser', role: 'admin' }, process.env.JWT_SECRET);

// Mock Case model methods before requiring app
const Case = require('../src/models/Case');

// Sample data
const sampleCases = [
  {
    id: 1,
    internal_number: 'AN202501000001',
    case_number: '2025民初001',
    case_cause: '合同纠纷',
    plaintiffs: [
      { id: 11, name: '张三', party_type: '原告', entity_type: '个人', contact_phone: '13800138000', address: '北京市朝阳区', is_primary: 1 }
    ],
    defendants: [
      { id: 21, name: '某某科技有限公司', party_type: '被告', entity_type: '企业', contact_phone: '010-12345678', address: '北京市海淀区', is_primary: 1 }
    ],
    third_parties: []
  }
];

// override model methods
Case.findAllWithParties = jest.fn().mockResolvedValue(sampleCases);
Case.findAll = jest.fn().mockResolvedValue(sampleCases);
Case.findByIdWithParties = jest.fn().mockImplementation(async (id) => sampleCases.find(c => c.id == id) );
Case.findById = jest.fn().mockImplementation(async (id) => sampleCases.find(c => c.id == id) );

let app;
beforeAll(() => {
  app = require('../src/app');
});

describe('GET /api/cases/export', () => {
  it('should return xlsx multi-sheet when includeParties=true & exportMode=multi-sheet', async () => {
    const res = await request(app)
      .get('/api/cases/export?includeParties=true&exportMode=multi-sheet')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.headers['content-type']).toMatch(/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should return csv single-sheet when format=csv&exportMode=single-sheet', async () => {
    const res = await request(app)
      .get('/api/cases/export?includeParties=true&exportMode=single-sheet&format=csv')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text.length).toBeGreaterThan(0);
  });

  it('should support caseIds parameter', async () => {
    const res = await request(app)
      .get('/api/cases/export?caseIds=1&includeParties=true&exportMode=single-sheet')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.headers['content-type']).toMatch(/application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
  });
});
