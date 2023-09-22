import {createEidsArray} from 'modules/userId/eids.js';
import {expect} from 'chai';
import {setSubmoduleRegistry} from 'modules/userId/index.js';
import {liveIntentIdSubmodule} from 'modules/liveIntentIdSystem.js';

// 'bidswitch': {
//   source: 'bidswitch.net',
//   atype: 3,
//   getValue: function(data) {
//     return data.id;
//   },
//   getUidExt: function(data) {
//     if (data.ext) {
//       return data.ext;
//     }
//   }
// },
// 'medianet': {
//   source: 'media.net',
//   atype: 3,
//   getValue: function(data) {
//     return data.id;
//   },
//   getUidExt: function(data) {
//     if (data.ext) {
//       return data.ext;
//     }
//   }
// },
// 'magnite': {
//   source: 'rubiconproject.com',
//   atype: 3,
//   getValue: function(data) {
//     return data.id;
//   },
//   getUidExt: function(data) {
//     if (data.ext) {
//       return data.ext;
//     }
//   }
// },
// 'index': {
//   source: 'liveintent.indexexchange.com',
//   atype: 3,
//   getValue: function(data) {
//     return data.id;
//   },
//   getUidExt: function(data) {
//     if (data.ext) {
//       return data.ext;
//     }
//   }
// }
// }

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
      id: 'some-random-id-value',
        segments: [1, 2, 3]
      }
    };
    const newEids = createEidsArray(userId);
    expect(newEids.length).to.equal(1);
    expect(newEids[0]).to.deep.equal({
      source: 'liveintent.com',
      uids: [{id: 'some-random-id-value', atype: 3}],
      ext: {segments: [1, 2]}
    });
  });
});
