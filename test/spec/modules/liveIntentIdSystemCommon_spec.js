import {expect} from 'chai';
import {reset as resetLiveIntentIdSubmodule, liveIntentIdSubmodule} from 'modules/liveIntentIdSystem.js';

describe('Standard LiveIntentId id decoding', function() {
  doTest();
});

describe('Minimal LiveIntentId id decoding', function() {
  before(function () {
    liveIntentIdSubmodule.setModuleMode('minimal');
  })
  after(function() {
    resetLiveIntentIdSubmodule();
  })
  doTest();
});

function doTest() {
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
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'uid2': 'bar'}, 'uid2': {'id': 'bar', "ext": {"provider": "liveintent.com"}}});
  });

  it('should decode values with uid2 but no nonId', function() {
    const result = liveIntentIdSubmodule.decode({ uid2: 'bar' });
    expect(result).to.eql({'uid2': {'id': 'bar', "ext": {"provider": "liveintent.com"}}});
  });

  it('should decode a bidswitch id to a seperate object when present', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', bidswitch: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'bidswitch': 'bar'}, 'bidswitch': {'id': 'bar', "ext": {"provider": "liveintent.com"}}});
  });

  it('should decode a medianet id to a seperate object when present', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', medianet: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'medianet': 'bar'}, 'medianet': {'id': 'bar', "ext": {"provider": "liveintent.com"}}});
  });

  it('should decode a magnite id to a seperate object when present', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', magnite: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'magnite': 'bar'}, 'magnite': {'id': 'bar', "ext": {"provider": "liveintent.com"}}});
  });

  it('should decode an index id to a seperate object when present', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', index: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'index': 'bar'}, 'index': {'id': 'bar', "ext": {"provider": "liveintent.com"}}});
  });

  it('should decode an openx id to a seperate object when present', function () {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', openx: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'openx': 'bar'}, 'openx': {'id': 'bar', "ext": {"provider": "liveintent.com"}}});
  });

  it('should decode an pubmatic id to a seperate object when present', function() {
    const result = liveIntentIdSubmodule.decode({ nonId: 'foo', pubmatic: 'bar' });
    expect(result).to.eql({'lipb': {'lipbid': 'foo', 'nonId': 'foo', 'pubmatic': 'bar'}, 'pubmatic': {'id': 'bar', "ext": {"provider": "liveintent.com"}}});
  });
}
