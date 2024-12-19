import {liveintentRtdSubmodule} from 'modules/liveintentRtdProvider.js';
import * as utils from 'src/utils.js';
import { expect } from 'chai';

describe('Liveintent Rtd Provider', function () {
  const SUBMODULE_NAME = 'liveintent';

  describe('submodule `init`', function () {
    const config = {
      name: SUBMODULE_NAME,
    };
    it('init returns true when the subModuleName is defined', function () {
      const value = liveintentRtdSubmodule.init(config);
      expect(value).to.equal(true);
    });
  })

  describe('submodule `onBidRequestEvent`', function () {
    const bidReqConfig = {
      bidderCode: 'appnexus',
      auctionId: '8dbd7cb1-7f6d-4f84-946c-d0df4837234a',
      bidderRequestId: '2a038c6820142b',
      bids: [
        {
        	bidder: 'appnexus',
        	params: {
        		siteId: 'examplePub123',
        		productId: 'siab|inview'
        	},
        	userId: {
        		lipbid: {
        			segments: [
        				'asa_1231',
        				'lalo_4311',
        				'liurl_99123'
        			],
        			fpid: 'test_fpid'
        		}
        	}
        }
      ]
    }

    it('exists', function () {
      expect(liveintentRtdSubmodule.onBidRequestEvent).to.be.a('function');
    });

    it('extracts segments and move them to the bidRequest.ortb2.user.data when there is user.data is undefined', function() {
      const bidRequest = utils.deepClone(bidReqConfig);

      liveintentRtdSubmodule.onBidRequestEvent(bidRequest);
      const segments = bidRequest.bids[0].ortb2.user.data;
      const expectedSegments = [{name: 'liveintent.com', segment: [{id: 'asa_1231'}, {id: 'lalo_4311'}, {id: 'liurl_99123'}]}]

      expect(segments).to.deep.equal(expectedSegments);
    });

    it('extracts segments and move them to the bidRequest.ortb2.user.data withe existing data', function() {
      bidReqConfig.bids[0].ortb2 = {
        user: {
          data: [
            {
              name: 'example.com',
              segment: [
                { id: 'a_1231' },
                { id: 'b_4311' }
              ]
            }
          ]
        }
      }
      const bidRequest = utils.deepClone(bidReqConfig);

      liveintentRtdSubmodule.onBidRequestEvent(bidRequest);
      const segments = bidRequest.bids[0].ortb2.user.data;
      const expectedSegments = [{name: 'example.com', segment: [{id: 'a_1231'}, {id: 'b_4311'}]}, {name: 'liveintent.com', segment: [{id: 'asa_1231'}, {id: 'lalo_4311'}, {id: 'liurl_99123'}]}]
      expect(segments).to.deep.equal(expectedSegments);
    });
  });
});
