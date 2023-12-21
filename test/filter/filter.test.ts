import * as http from 'http';

import * as chai from 'chai';

// Chai is bad with types. See:
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/19480
import chaiHttp = require('chai-http');

import * as server from '../../src/server';
import * as db from '../../src/db';

chai.use(chaiHttp);
chai.should();

describe('pathobject', async () => {
  let srv: http.Server;
  before(async () => {
    process.env.LOAD_METHOD = 'fs';
    process.env.DATAFILES_FILE = 'test/filter/data.json';
    const app = await server.appFromBundle(db.getInitialBundles());
    srv = app.listen({ port: 4000 });
  });

  it('searchable field - equals', async () => {
    const query = `
      {
        test: resources_v1(name: "resource A") {
          name
        }
      }
      `;
    const resp = await chai.request(srv)
      .post('/graphql')
      .set('content-type', 'application/json')
      .send({ query });
    resp.should.have.status(200);
    resp.body.data.test[0].name.should.equal('resource A');
  });

  it('searchable field - null value', async () => {
    const query = `
      {
        test: resources_v1(name: null) {
          name
        }
      }
      `;
    const resp = await chai.request(srv)
      .post('/graphql')
      .set('content-type', 'application/json')
      .send({ query });
    resp.should.have.status(200);
    resp.body.data.test.length.should.equal(6);
  });

  it('filter object - field value eq', async () => {
    const query = `
      {
        test: resources_v1(filter: {name: "resource A"}) {
          name
        }
      }
      `;
    const resp = await chai.request(srv)
      .post('/graphql')
      .set('content-type', 'application/json')
      .send({ query });
    resp.should.have.status(200);
    resp.body.data.test[0].name.should.equal('resource A');
  });

  it('filter object - in (contains) condition', async () => {
    const query = `
      {
        test: resources_v1(filter: {name: {in: ["resource A", "resource B"]}}) {
          name
        }
      }
      `;
    const resp = await chai.request(srv)
      .post('/graphql')
      .set('content-type', 'application/json')
      .send({ query });
    resp.should.have.status(200);
    new Set(resp.body.data.test.map((r: { name: string; }) => r.name)).should.deep.equal(new Set(['resource A', 'resource B']));
  });

  it('filter object - unknown field', async () => {
    const query = `
      {
        test: resources_v1(filter: {unknown_field: "value"}) {
          name
        }
      }
      `;
    const resp = await chai.request(srv)
      .post('/graphql')
      .set('content-type', 'application/json')
      .send({ query });
    resp.should.have.status(200);
    resp.body.errors.length.should.equal(1);
  });

  it('filter object - null field value', async () => {
    const query = `
      {
        test: resources_v1(filter: {optional_field: null}) {
          name
        }
      }
      `;
    const resp = await chai.request(srv)
      .post('/graphql')
      .set('content-type', 'application/json')
      .send({ query });
    resp.should.have.status(200);
    resp.body.data.test.length.should.equal(1);
    resp.body.data.test[0].name.should.equal('resource D');
  });

  it('filter object - list field eq', async () => {
    const query = `
      {
        test: resources_v1(filter: {list_field: ["A", "B", "C"]}) {
          name
        }
      }
      `;
    const resp = await chai.request(srv)
      .post('/graphql')
      .set('content-type', 'application/json')
      .send({ query });
    resp.body.data.test.length.should.equal(1);
    resp.body.data.test[0].name.should.equal('resource E');
  });

  it('filter object - null list field', async () => {
    const query = `
      {
        test: resources_v1(filter: {list_field: null}) {
          name
        }
      }
      `;
    const resp = await chai.request(srv)
      .post('/graphql')
      .set('content-type', 'application/json')
      .send({ query });
    resp.should.have.status(200);
    new Set(resp.body.data.test.map((r: { name: string; }) => r.name)).should.deep.equal(new Set(['resource A', 'resource B', 'resource C', 'resource D']));
  });
});