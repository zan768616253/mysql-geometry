'use strict';

const _ = require('lodash');
const BB = require('bluebird');
const co = require('co');
const chai = require('chai');
const mysql = require('mysql');
const format = require('string-template');


const expect = chai.expect;

BB.promisifyAll(require('mysql/lib/Pool').prototype);
BB.promisifyAll(require('mysql/lib/Connection').prototype);

describe('test', () => {
  const fake1 = {
    name: '0 0,10 0,10 10,0 10,0 00',
    g: 'Polygon((0 0,10 0,10 10,0 10,0 0))',
    desc: 'large top left'
  };
  const fake2 = {
    name: '0 30,10 30,10 40,0 40,0 30',
    g: 'Polygon((0 30,10 30,10 40,0 40,0 30))',
    desc: 'large bottom left'
  };
  const fake3 = {
    name: '30 0,40 0,40 10,30 10,30 0',
    g: 'Polygon((30 0,40 0,40 10,30 10,30 0))',
    desc: 'large top right'
  };
  const fake4 = {
    name: '30 30,40 30,40 40,30 40,30 30',
    g: 'Polygon((30 30,40 30,40 40,30 40,30 30))',
    desc: 'large bottom right'
  };
  const fake5 = {
    name: '0 0,5 0,5 5,0 5,0 0',
    g: 'Polygon((0 0,5 0,5 5,0 5,0 0))',
    desc: 'small top left'
  };
  const fake6 = {
    name: 'multi polygon 2',
    g: 'Polygon((0 0,10 0,10 10,0 10,0 0),(0 30,10 30,10 40,0 40,0 30))',
    desc: 'large top left & large bottom left'
  };

  const fake7 = {
    name: 'multi polygon 1',
    g: 'Polygon((30 30,40 30,40 40,30 40,30 30),(30 0,40 0,40 10,30 10,30 0))',
    desc: 'large bottom right & large top right'
  };

  const fakes = [fake1, fake2, fake3, fake4, fake6, fake7]

  let connection;
  let insert;

  before (() => {
    let values = '';
    let value = ''

    fakes.forEach((fake) => {
      value = format("('{name}', GeomFromText('{geom}'), '{desc}'), ", {
        name: fake.name,
        geom: fake.g,
        desc: fake.desc
      });
      values = values.concat(value);
    });
    insert = format('INSERT INTO Geom (polygon_name, geom, description) VALUES {values}', {
      values: values.substring(0, values.lastIndexOf(','))
    });

    connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '0',
      database: 'node_geo'
    });

    connection.connect();

    connection.query('DELETE FROM Geom', (err, result) => {
      if (err) {
        console.log(format('before-delete records-err: {err}', {
          err: err.message
        }));
      }

      console.log(format('{count} rows are deleted', {
        count: result.affectedRows
      }));
    });
  });

  it('should create new geometry records', (done) => {
    connection.queryAsync(insert).then((result) => {
      expect(result.affectedRows).to.be.eql(fakes.length);
      done();
    }).catch((err) => {
      expect(err).to.be.undefined;
      done();
    });
  });

  it('should intersect with fake 1 polygon', (done) => {
    let g5 = format("GeomFromText('{geom}')", { geom: fake5.g });
    let query_get_polygon1 =
      format("SELECT geom FROM Geom WHERE description = '{desc}'", { desc: fake1.desc });
    let query_cross =
      format("SELECT INTERSECTS({g5}, ({g1})) AS RESULT", {
        g5: g5,
        g1: query_get_polygon1
      });
    connection.queryAsync(query_cross).then((result) => {
      expect(result.length).to.be.eql(1);
      expect(result[0].RESULT).to.be.eql(1);
      done();
    }).catch((err) => {
      expect(err).to.be.undefined;
      done();
    });
  });

  it('should not intersect with fake 5 polygon', (done) => {
    let g5 = format("GeomFromText('{geom}')", { geom: fake5.g });
    let query_get_polygon4 =
      format("SELECT geom FROM Geom WHERE description = '{desc}'", { desc: fake4.desc });
    let query_cross =
      format("SELECT INTERSECTS({g5}, ({g4})) AS RESULT", {
        g5: g5,
        g4: query_get_polygon4
      });
    connection.queryAsync(query_cross).then((result) => {
      expect(result.length).to.be.eql(1);
      expect(result[0].RESULT).to.be.eql(0);
      done();
    }).catch((err) => {
      expect(err).to.be.undefined;
      done();
    });
  });

  it('should intersect with fake 6 multi polygon', (done) => {
    let g5 = format("GeomFromText('{geom}')", { geom: fake5.g });
    let query_get_polygon6 =
      format("SELECT geom FROM Geom WHERE description = '{desc}'", { desc: fake6.desc });
    let query_cross =
      format("SELECT INTERSECTS({g5}, ({g1})) AS RESULT", {
        g5: g5,
        g1: query_get_polygon6
      });
    connection.queryAsync(query_cross).then((result) => {
      expect(result.length).to.be.eql(1);
      expect(result[0].RESULT).to.be.eql(1);
      done();
    }).catch((err) => {
      expect(err).to.be.undefined;
      done();
    });
  });

  it('should not intersect with fake 7 multi polygon', (done) => {
    let g5 = format("GeomFromText('{geom}')", { geom: fake5.g });
    let query_get_polygon7 =
      format("SELECT geom FROM Geom WHERE description = '{desc}'", { desc: fake7.desc });
    let query_cross =
      format("SELECT INTERSECTS({g5}, ({g4})) AS RESULT", {
        g5: g5,
        g4: query_get_polygon7
      });
    connection.queryAsync(query_cross).then((result) => {
      expect(result.length).to.be.eql(1);
      expect(result[0].RESULT).to.be.eql(0);
      done();
    }).catch((err) => {
      expect(err).to.be.undefined;
      done();
    });
  });

  it('should get the spatial data as string', (done) => {
    let query = format("SELECT AsText(geom) AS RESULT FROM Geom WHERE description = '{desc}'", {
      desc: fake7.desc
    });
    connection.queryAsync(query).then((result) => {
      expect(result.length).to.be.eql(1);
      let sg = fake7.g.toUpperCase();
      let rg = result[0].RESULT;
      expect(rg).to.be.eql(sg);
      done();
    }).catch((err) => {
      expect(err).to.be.undefined;
      done();
    });
  });
});
