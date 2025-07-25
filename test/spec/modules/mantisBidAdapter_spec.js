import {expect} from 'chai';
import {spec, storage} from 'modules/mantisBidAdapter.js';
import {newBidder} from 'src/adapters/bidderFactory.js';
import {sfPostMessage, iframePostMessage} from 'modules/mantisBidAdapter';

describe('MantisAdapter', function () {
  const adapter = newBidder(spec);
  const sandbox = sinon.createSandbox();
  let clock;

  beforeEach(function () {
    clock = sandbox.useFakeTimers();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('isBidRequestValid', function () {
    const bid = {
      'bidder': 'mantis',
      'params': {
        'property': '10433394',
        'zone': 'zone'
      },
      'adUnitCode': 'adunit-code',
      'sizes': [[300, 250], [300, 600]],
      'bidId': '30b31c1838de1e',
      'bidderRequestId': '22edbae2733bf6',
      'auctionId': '1d1a030790a475',
    };

    it('should return true when required params found', function () {
      expect(spec.isBidRequestValid(bid)).to.equal(true);
    });

    it('should return false when required params are not passed', function () {
      const invalidBid = Object.assign({}, bid);
      delete invalidBid.params;
      invalidBid.params = {};
      expect(spec.isBidRequestValid(invalidBid)).to.equal(false);
    });
  });

  describe('viewability', function() {
    it('iframe (viewed)', () => {
      let viewed = false;

      sandbox.stub(document, 'getElementsByTagName').withArgs('iframe').returns([
        {
          name: 'mantis',
          getBoundingClientRect: () => ({
            top: 10,
            bottom: 260,
            left: 10,
            right: 190,
            width: 300,
            height: 250
          })
        }
      ]);

      iframePostMessage({innerHeight: 500, innerWidth: 500}, 'mantis', () => viewed = true);

      sandbox.clock.runAll();

      expect(viewed).to.equal(true);
    });

    it('safeframe (viewed)', () => {
      let viewed = false;

      sfPostMessage({
        ext: {
          register: (width, height, callback) => {
            expect(width).to.equal(100);
            expect(height).to.equal(200);

            callback();
          },
          inViewPercentage: () => 60
        }
      }, 100, 200, () => viewed = true);

      expect(viewed).to.equal(true);
    });

    it('safeframe (unviewed)', () => {
      let viewed = false;

      sfPostMessage({
        ext: {
          register: (width, height, callback) => {
            expect(width).to.equal(100);
            expect(height).to.equal(200);

            callback();
          },
          inViewPercentage: () => 30
        }
      }, 100, 200, () => viewed = true);

      expect(viewed).to.equal(false);
    });
  });

  describe('buildRequests', function () {
    const bidRequests = [
      {
        'bidder': 'mantis',
        'params': {
          'property': '10433394',
          'zone': 'zone'
        },
        'adUnitCode': 'adunit-code',
        'sizes': [[300, 250], [300, 600]],
        'bidId': '30b31c1838de1e',
        'bidderRequestId': '22edbae2733bf6',
        'auctionId': '1d1a030790a475',
      }
    ];

    it('gdpr consent not required', function () {
      const request = spec.buildRequests(bidRequests, {gdprConsent: {gdprApplies: false}});

      expect(request.url).not.to.include('consent=false');
    });

    it('gdpr consent required', function () {
      const request = spec.buildRequests(bidRequests, {gdprConsent: {gdprApplies: true}});

      expect(request.url).to.include('consent=false');
    });

    it('usp consent', function () {
      const request = spec.buildRequests(bidRequests, {uspConsent: 'foobar'});

      expect(request.url).to.include('usp=foobar');
    });

    it('domain override', function () {
      window.mantis_domain = 'https://foo';
      const request = spec.buildRequests(bidRequests);

      expect(request.url).to.include('https://foo');

      delete window.mantis_domain;
    });

    it('standard request', function () {
      const request = spec.buildRequests(bidRequests);

      expect(request.url).to.include('property=10433394');
      expect(request.url).to.include('bids[0][bidId]=30b31c1838de1e');
      expect(request.url).to.include('bids[0][config][zone]=zone');
      expect(request.url).to.include('bids[0][sizes][0][width]=300');
      expect(request.url).to.include('bids[0][sizes][0][height]=250');
      expect(request.url).to.include('bids[0][sizes][1][width]=300');
      expect(request.url).to.include('bids[0][sizes][1][height]=600');
    });

    it('use window uuid', function () {
      window.mantis_uuid = 'foo';

      const request = spec.buildRequests(bidRequests);

      expect(request.url).to.include('uuid=foo');

      delete window.mantis_uuid;
    });

    it('use storage uuid', function () {
      sandbox.stub(storage, 'hasLocalStorage').callsFake(() => true);
      sandbox.stub(storage, 'getDataFromLocalStorage').withArgs('mantis:uuid').returns('bar');

      const request = spec.buildRequests(bidRequests);

      expect(request.url).to.include('uuid=bar');
    });

    it('detect amp', function () {
      var oldContext = window.context;

      window.context = {};
      window.context.tagName = 'AMP-AD';
      window.context.canonicalUrl = 'foo';

      const request = spec.buildRequests(bidRequests);

      expect(request.url).to.include('amp=true');
      expect(request.url).to.include('url=foo');

      delete window.context.tagName;
      delete window.context.canonicalUrl;

      window.context = oldContext;
    });
  });

  describe('getUserSyncs', function () {
    it('iframe', function () {
      const result = spec.getUserSyncs({
        iframeEnabled: true
      });

      expect(result[0].type).to.equal('iframe');
      expect(result[0].url).to.include('https://mantodea.mantisadnetwork.com/prebid/iframe');
    });

    it('pixel', function () {
      const result = spec.getUserSyncs({
        pixelEnabled: true
      });

      expect(result[0].type).to.equal('image');
      expect(result[0].url).to.include('https://mantodea.mantisadnetwork.com/prebid/pixel');
    });
  });

  describe('interpretResponse', function () {
    it('use ad ttl if provided', function () {
      const response = {
        body: {
          ttl: 360,
          uuid: 'uuid',
          ads: [
            {
              bid: 'bid',
              cpm: 1,
              view: 'view',
              width: 300,
              ttl: 250,
              height: 250,
              html: '<!-- Creative -->'
            }
          ]
        }
      };

      const expectedResponse = [
        {
          requestId: 'bid',
          cpm: 1,
          width: 300,
          height: 250,
          ttl: 250,
          ad: '<!-- Creative -->',
          creativeId: 'view',
          netRevenue: true,
          meta: {
            advertiserDomains: []
          },
          currency: 'USD'
        }
      ];
      let bidderRequest;

      const result = spec.interpretResponse(response, {bidderRequest});
      expect(result[0]).to.deep.equal(expectedResponse[0]);
    });

    it('use global ttl if provded', function () {
      const response = {
        body: {
          ttl: 360,
          uuid: 'uuid',
          ads: [
            {
              bid: 'bid',
              cpm: 1,
              view: 'view',
              domains: ['foobar.com'],
              width: 300,
              height: 250,
              html: '<!-- Creative -->'
            }
          ]
        }
      };

      const expectedResponse = [
        {
          requestId: 'bid',
          cpm: 1,
          width: 300,
          height: 250,
          ttl: 360,
          ad: '<!-- Creative -->',
          creativeId: 'view',
          netRevenue: true,
          meta: {
            advertiserDomains: ['foobar.com']
          },
          currency: 'USD'
        }
      ];
      let bidderRequest;

      const result = spec.interpretResponse(response, {bidderRequest});
      expect(result[0]).to.deep.equal(expectedResponse[0]);
    });

    it('display ads returned', function () {
      const response = {
        body: {
          uuid: 'uuid',
          ads: [
            {
              bid: 'bid',
              cpm: 1,
              view: 'view',
              width: 300,
              domains: ['foobar.com'],
              height: 250,
              html: '<!-- Creative -->'
            }
          ]
        }
      };

      const expectedResponse = [
        {
          requestId: 'bid',
          cpm: 1,
          width: 300,
          height: 250,
          ttl: 86400,
          ad: '<!-- Creative -->',
          creativeId: 'view',
          netRevenue: true,
          meta: {
            advertiserDomains: ['foobar.com']
          },
          currency: 'USD'
        }
      ];
      let bidderRequest;

      sandbox.stub(storage, 'hasLocalStorage').returns(true);
      const spy = sandbox.spy(storage, 'setDataInLocalStorage');

      const result = spec.interpretResponse(response, {bidderRequest});

      expect(spy.calledWith('mantis:uuid', 'uuid'));
      expect(result[0]).to.deep.equal(expectedResponse[0]);
      expect(window.mantis_uuid).to.equal(response.body.uuid);
    });

    it('no ads returned', function () {
      const response = {
        body: {
          ads: []
        }
      };
      let bidderRequest;

      const result = spec.interpretResponse(response, {bidderRequest});
      expect(result.length).to.equal(0);
    });
  });
});
