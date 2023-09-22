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

describe('LiveIntentId id decoding', function() {
  it('should decode a unifiedId to lipbId and remove it', function() {
    const result = liveIntentIdSubmodule.decode({ unifiedId: 'data' });
    expect(result).to.eql({'lipb': {'lipbid': 'data'}});
  });

  it('should decode a nonId to lipbId', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'data' });
    expect(result).to.eql({'lipb': {'lipbid': 'data', 'nonId': 'data'}});
  });

  it('should decode a uid2 to a seperate object when present', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', uid2: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'uid2': 'bar'}, 'uid2': {'id': 'bar', 'ext': {'provider': 'liveintent.com'}}});
  });

  it('should decode values with uid2 but no nonId', function() {
    const result = liveIntentIdSubmodule.decode({ uid2: 'bar' });
    expect(result).to.eql({'uid2': {'id': 'bar', 'ext': {'provider': 'liveintent.com'}}});
  });

  it('should decode a bidswitch id to a seperate object when present', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', bidswitch: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'bidswitch': 'bar'}, 'bidswitch': {'id': 'bar', 'ext': {'provider': 'liveintent.com'}}});
  });

  it('should decode a medianet id to a seperate object when present', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', medianet: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'medianet': 'bar'}, 'medianet': {'id': 'bar', 'ext': {'provider': 'liveintent.com'}}});
  });

  it('should decode a magnite id to a seperate object when present', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', magnite: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'magnite': 'bar'}, 'magnite': {'id': 'bar', 'ext': {'provider': 'liveintent.com'}}});
  });

  it('should decode an index id to a seperate object when present', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', index: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'index': 'bar'}, 'index': {'id': 'bar', 'ext': {'provider': 'liveintent.com'}}});
  });

  it('should decode an openx id to a seperate object when present', function () {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', openx: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'openx': 'bar'}, 'openx': {'id': 'bar', 'ext': {'provider': 'liveintent.com'}}});
  });

  it('should decode an pubmatic id to a seperate object when present', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', pubmatic: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'pubmatic': 'bar'}, 'pubmatic': {'id': 'bar', 'ext': {'provider': 'liveintent.com'}}});
  });

});
