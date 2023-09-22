import {createEidsArray} from 'modules/userId/eids.js';
import {expect} from 'chai';
import {setSubmoduleRegistry} from 'modules/userId/index.js';
import {liveIntentIdSubmodule} from 'modules/liveIntentIdSystem.js';

describe('LiveIntentId eids conversion', function() {
  before(() => setSubmoduleRegistry([liveIntentIdSubmodule]));

  after(() => setSubmoduleRegistry([]));

  it('lipb', function() {
    const userId = {
      lipb: {
        lipbid: 'some-random-id-value',
        segments: [1, 2, 3]
      }
    };
    const newEids = createEidsArray(userId);
    expect(newEids.length).to.equal(1);
    expect(newEids[0]).to.deep.equal({
      source: 'liveintent.com',
      uids: [{id: 'some-random-id-value', atype: 3}],
      ext: {segments: [1, 2, 3]}
    });
  });

  it('bidswitch', function() {
    const userId = {
      bidswitch: {
        id: 'some-random-id-value',
      }
    };
    const newEids = createEidsArray(userId);
    expect(newEids.length).to.equal(1);
    expect(newEids[0]).to.deep.equal({
      source: 'bidswitch.net',
      uids: [{id: 'some-random-id-value', atype: 3, ext: {provider: 'liveintent.com'}}]
    });
  });

  it('medianet', function() {
    const userId = {
      medianet: {
        id: 'some-random-id-value',
      }
    };
    const newEids = createEidsArray(userId);
    expect(newEids.length).to.equal(1);
    expect(newEids[0]).to.deep.equal({
      source: 'media.net',
      uids: [{id: 'some-random-id-value', atype: 3, ext: {provider: 'liveintent.com'}}]
    });
  });

  it('magnite', function() {
    const userId = {
      magnite: {
        id: 'some-random-id-value',
      }
    };
    const newEids = createEidsArray(userId);
    expect(newEids.length).to.equal(1);
    expect(newEids[0]).to.deep.equal({
      source: 'rubiconproject.com',
      uids: [{id: 'some-random-id-value', atype: 3, ext: {provider: 'liveintent.com'}}]
    });
  });

  it('index', function() {
    const userId = {
      index: {
        id: 'some-random-id-value',
      }
    };
    const newEids = createEidsArray(userId);
    expect(newEids.length).to.equal(1);
    expect(newEids[0]).to.deep.equal({
      source: 'liveintent.indexexchange.com',
      uids: [{id: 'some-random-id-value', atype: 3, ext: {provider: 'liveintent.com'}}]
    });
  });

  it('uid2', function() {
    const userId = {
      uid2: {
        id: 'some-random-id-value',
      }
    };
    const newEids = createEidsArray(userId);
    expect(newEids.length).to.equal(1);
    expect(newEids[0]).to.deep.equal({
      source: 'uidapi.com',
      uids: [{id: 'some-random-id-value', atype: 3, ext: {provider: 'liveintent.com'}}]
    });
  });

  it('openx', function() {
    const userId = {
      openx: {
        id: 'some-random-id-value',
      }
    };
    const newEids = createEidsArray(userId);
    expect(newEids.length).to.equal(1);
    expect(newEids[0]).to.deep.equal({
      source: 'openx.com',
      uids: [{id: 'some-random-id-value', atype: 3, ext: {provider: 'liveintent.com'}}]
    });
  });

  it('pubmatic', function() {
    const userId = {
      pubmatic: {
        id: 'some-random-id-value',
      }
    };
    const newEids = createEidsArray(userId);
    expect(newEids.length).to.equal(1);
    expect(newEids[0]).to.deep.equal({
      source: 'KADUSERCOOKIE',
      uids: [{id: 'some-random-id-value', atype: 3, ext: {provider: 'liveintent.com'}}]
    });
  });
});
