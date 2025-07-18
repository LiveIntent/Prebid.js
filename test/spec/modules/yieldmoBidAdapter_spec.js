import { expect } from 'chai';
import { spec } from 'modules/yieldmoBidAdapter.js';
import * as utils from 'src/utils.js';

/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */
// above is used for debugging purposes only

describe('YieldmoAdapter', function () {
  const BANNER_ENDPOINT = 'https://ads.yieldmo.com/exchange/prebid';
  const VIDEO_ENDPOINT = 'https://ads.yieldmo.com/exchange/prebidvideo';
  const PB_COOKIE_ASSIST_SYNC_ENDPOINT = `https://ads.yieldmo.com/pbcas`;

  const mockBannerBid = (rootParams = {}, params = {}) => ({
    bidder: 'yieldmo',
    params: {
      bidFloor: 0.1,
      ...params,
    },
    adUnitCode: 'adunit-code',
    mediaTypes: {
      banner: {
        sizes: [
          [300, 250],
          [300, 600],
        ],
      },
    },
    bidId: '30b31c1838de1e',
    bidderRequestId: '22edbae2733bf6',
    auctionId: '1d1a030790a475',
    crumbs: {
      pubcid: 'c604130c-0144-4b63-9bf2-c2bd8c8d86da',
    },
    userId: {
      tdid: '8d146286-91d4-4958-aff4-7e489dd1abd6'
    },
    transactionId: '54a58774-7a41-494e-9aaf-fa7b79164f0c',
    ...rootParams
  });

  const mockVideoBid = (rootParams = {}, params = {}, videoParams = {}) => ({
    bidder: 'yieldmo',
    adUnitCode: 'adunit-code-video',
    bidId: '321video123',
    auctionId: '1d1a03073455',
    mediaTypes: {
      video: {
        playerSize: [640, 480],
        context: 'instream',
        mimes: ['video/mp4'],
      },
    },
    params: {
      placementId: '123',
      ...params,
      video: {
        placement: 1,
        maxduration: 30,
        startdelay: 10,
        protocols: [2, 3],
        api: [2, 3],
        skipppable: true,
        playbackmethod: [1, 2],
        ...videoParams,
      },
    },
    transactionId: '54a58774-7a41-494e-8cbc-fa7b79164f0c',
    ...rootParams,
  });

  const mockBidderRequest = (params = {}, bids = [mockBannerBid()]) => ({
    bidderCode: 'yieldmo',
    auctionId: 'e3a336ad-2761-4a1c-b421-ecc7c5294a34',
    bidderRequestId: '14c4ede8c693f',
    bids,
    auctionStart: 1520001292880,
    start: 1520001292884,
    doneCbCallCount: 0,
    refererInfo: {
      numIframes: 1,
      reachedTop: true,
      referer: 'yieldmo.com',
    },
    ...params
  });

  const mockGetFloor = floor => ({getFloor: () => ({ currency: 'USD', floor })});

  describe('isBidRequestValid', function () {
    describe('Banner:', function () {
      it('should return true when necessary information is found', function () {
        expect(spec.isBidRequestValid(mockBannerBid())).to.be.true;
      });

      it('should return false when necessary information is not found', function () {
        // empty bid
        expect(spec.isBidRequestValid({})).to.be.false;

        // empty bidId
        expect(spec.isBidRequestValid(mockBannerBid({bidId: ''}))).to.be.false;

        // empty adUnitCode
        expect(spec.isBidRequestValid(mockBannerBid({adUnitCode: ''}))).to.be.false;

        const invalidBid = mockBannerBid();
        delete invalidBid.mediaTypes.banner;
        expect(spec.isBidRequestValid(invalidBid)).to.be.false;
      });
    });

    describe('Instream video:', function () {
      const getVideoBidWithoutParam = (key, paramToRemove) => {
        const bid = mockVideoBid();
        delete utils.deepAccess(bid, key)[paramToRemove];
        return bid;
      }

      it('should return true when necessary information is found', function () {
        expect(spec.isBidRequestValid(mockVideoBid())).to.be.true;
      });

      it('should return false when necessary information is not found', function () {
        // empty bidId
        expect(spec.isBidRequestValid(mockVideoBid({bidId: ''}))).to.be.false;

        // empty adUnitCode
        expect(spec.isBidRequestValid(mockVideoBid({adUnitCode: ''}))).to.be.false;
      });

      it('should return false when required mediaTypes.video.* param is not found', function () {
        const getBidAndExclude = paramToRemove => getVideoBidWithoutParam('mediaTypes.video', paramToRemove);

        expect(spec.isBidRequestValid(getBidAndExclude('playerSize'))).to.be.false;
        expect(spec.isBidRequestValid(getBidAndExclude('mimes'))).to.be.false;
      });

      it('should return false when required bid.params.* is not found', function () {
        const getBidAndExclude = paramToRemove => getVideoBidWithoutParam('params', paramToRemove);

        expect(spec.isBidRequestValid(getBidAndExclude('placementId'))).to.be.false;
        expect(spec.isBidRequestValid(getBidAndExclude('video'))).to.be.false;
      });

      it('should return false when required bid.params.video.* is not found', function () {
        const getBidAndExclude = paramToRemove => getVideoBidWithoutParam('params.video', paramToRemove);
        expect(spec.isBidRequestValid(getBidAndExclude('maxduration'))).to.be.false;
        expect(spec.isBidRequestValid(getBidAndExclude('protocols'))).to.be.false;
        expect(spec.isBidRequestValid(getBidAndExclude('api'))).to.be.false;
      });
    });
  });

  describe('buildRequests', function () {
    const build = (bidRequests, bidderReq = mockBidderRequest()) => spec.buildRequests(bidRequests, bidderReq);
    const buildAndGetPlacementInfo = (bidRequests, index = 0, bidderReq = mockBidderRequest()) =>
      utils.deepAccess(build(bidRequests, bidderReq), `${index}.data.p`);
    const buildAndGetData = (bidRequests, index = 0, bidderReq = mockBidderRequest()) =>
      utils.deepAccess(build(bidRequests, bidderReq), `${index}.data`) || {};

    describe('Banner:', function () {
      it('should attempt to send banner bid requests to the endpoint via GET', function () {
        const requests = build([mockBannerBid()]);
        expect(requests.length).to.equal(1);
        expect(requests[0].method).to.equal('GET');
        expect(requests[0].url).to.be.equal(BANNER_ENDPOINT);
      });

      it('should pass default timeout in bid request', function () {
        const requests = build([mockBannerBid()]);
        expect(requests[0].data.tmax).to.equal(400);
      });
      it('should pass tmax to bid request', function () {
        const requests = build([mockBannerBid()], mockBidderRequest({timeout: 1000}));
        expect(requests[0].data.tmax).to.equal(1000);
      });
      it('should not blow up if crumbs is undefined', function () {
        expect(function () {
          build([mockBannerBid({crumbs: undefined})]);
        }).not.to.throw();
      });

      it('should place bid information into the p parameter of data', function () {
        const bidArray = [mockBannerBid()];
        expect(buildAndGetPlacementInfo(bidArray)).to.equal(
          '[{"placement_id":"adunit-code","callback_id":"30b31c1838de1e","sizes":[[300,250],[300,600]],"bidFloor":0.1,"auctionId":"1d1a030790a475"}]'
        );
        // multiple placements
        bidArray.push(mockBannerBid(
          {adUnitCode: 'adunit-2', bidId: '123a', bidderRequestId: '321', auctionId: '222', transactionId: '444'}, {bidFloor: 0.2}));
        expect(buildAndGetPlacementInfo(bidArray)).to.equal(
          '[{"placement_id":"adunit-code","callback_id":"30b31c1838de1e","sizes":[[300,250],[300,600]],"bidFloor":0.1,"auctionId":"1d1a030790a475"},' +
        '{"placement_id":"adunit-2","callback_id":"123a","sizes":[[300,250],[300,600]],"bidFloor":0.2,"auctionId":"222"}]'
        );
      });

      it('should add placement id if given', function () {
        const bidArray = [mockBannerBid({}, {placementId: 'ym_1293871298'})];
        let placementInfo = buildAndGetPlacementInfo(bidArray);
        expect(placementInfo).to.include('"ym_placement_id":"ym_1293871298"');
        expect(placementInfo).not.to.include('"ym_placement_id":"ym_0987654321"');
        bidArray.push(mockBannerBid({}, {placementId: 'ym_0987654321'}));
        placementInfo = buildAndGetPlacementInfo(bidArray);
        expect(placementInfo).to.include('"ym_placement_id":"ym_1293871298"');
        expect(placementInfo).to.include('"ym_placement_id":"ym_0987654321"');
      });

      it('should add additional information to data parameter of request', function () {
        const data = buildAndGetData([mockBannerBid()]);
        expect(data.hasOwnProperty('page_url')).to.be.true;
        expect(data.hasOwnProperty('bust')).to.be.true;
        expect(data.hasOwnProperty('pr')).to.be.true;
        expect(data.hasOwnProperty('scrd')).to.be.true;
        expect(data.dnt).to.be.false;
        expect(data.hasOwnProperty('description')).to.be.true;
        expect(data.hasOwnProperty('title')).to.be.true;
        expect(data.hasOwnProperty('h')).to.be.true;
        expect(data.hasOwnProperty('w')).to.be.true;
        expect(data.hasOwnProperty('pubcid')).to.be.true;
        expect(data.userConsent).to.equal('{"gdprApplies":"","cmp":"","gpp":"","gpp_sid":[]}');
        expect(data.us_privacy).to.equal('');
      });

      it('should add pubcid as parameter of request', function () {
        const pubcid = 'c604130c-0144-4b63-9bf2-c2bd8c8d86da2';
        const pubcidBid = mockBannerBid({crumbs: undefined, userId: {pubcid}});
        expect(buildAndGetData([pubcidBid]).pubcid).to.deep.equal(pubcid);
      });

      it('should add transaction id as parameter of request', function () {
        const transactionId = '54a58774-7a41-494e-9aaf-fa7b79164f0c';
        const pubcidBid = mockBannerBid({ ortb2Imp: {
          ext: {
            tid: '54a58774-7a41-494e-9aaf-fa7b79164f0c',
          }
        }});
        const bidRequest = buildAndGetData([pubcidBid]);
        expect(bidRequest.p).to.contain(transactionId);
      });

      it('should add auction id as parameter of request', function () {
        const auctionId = '1d1a030790a475';
        const pubcidBid = mockBannerBid({});
        const bidRequest = buildAndGetData([pubcidBid]);
        expect(bidRequest.p).to.contain(auctionId);
      });

      it('should add unified id as parameter of request', function () {
        const unifiedIdBid = mockBannerBid({crumbs: undefined});
        expect(buildAndGetData([unifiedIdBid]).tdid).to.deep.equal(mockBannerBid().userId.tdid);
      });

      it('should add CRITEO RTUS id as parameter of request', function () {
        const criteoId = 'aff4';
        const criteoIdBid = mockBannerBid({crumbs: undefined, userId: { criteoId }});
        expect(buildAndGetData([criteoIdBid]).cri_prebid).to.deep.equal(criteoId);
      });

      it('should add gdpr information to request if available', () => {
        const gdprConsent = {
          consentString: 'BOJ/P2HOJ/P2HABABMAAAAAZ+A==',
          vendorData: {blerp: 1},
          gdprApplies: true,
        };
        const data = buildAndGetData(
          [mockBannerBid()],
          0,
          mockBidderRequest({ gdprConsent })
        );
        expect(data.userConsent).equal(
          JSON.stringify({
            gdprApplies: true,
            cmp: 'BOJ/P2HOJ/P2HABABMAAAAAZ+A==',
            gpp: '',
            gpp_sid: [],
          })
        );
      });

      it('should add gpp information to request if available', () => {
        const gppConsent = {
          'gppString': 'BOJ/P2HOJ/P2HABABMAAAAAZ+A==',
          'applicableSections': [8]
        };
        const data = buildAndGetData([mockBannerBid()], 0, mockBidderRequest({gppConsent}));
        expect(data.userConsent).equal(
          JSON.stringify({
            gdprApplies: '',
            cmp: '',
            gpp: 'BOJ/P2HOJ/P2HABABMAAAAAZ+A==',
            gpp_sid: [8],
          })
        );
      });

      it('should add ccpa information to request if available', () => {
        const uspConsent = '1YNY';
        const data = buildAndGetData([mockBannerBid()], 0, mockBidderRequest({uspConsent}));
        expect(data.us_privacy).equal(uspConsent);
      });

      it('should add schain if it is in the bidRequest', () => {
        const schain = {
          ver: '1.0',
          complete: 1,
          nodes: [{asi: 'indirectseller.com', sid: '00001', hp: 1}],
        };
        const data = buildAndGetData([mockBannerBid({ortb2: {source: {ext: {schain}}}})]);
        expect(data.schain).equal(JSON.stringify(schain));
      });

      it('should process floors module if available', function () {
        const placementsData = JSON.parse(buildAndGetPlacementInfo([
          mockBannerBid({...mockGetFloor(3.99)}),
          mockBannerBid({...mockGetFloor(1.23)}, { bidFloor: 1.1 }),
        ]));
        expect(placementsData[0].bidFloor).to.equal(3.99);
        expect(placementsData[1].bidFloor).to.equal(1.23);
      });

      it('should use bidFloor if no floors module is available', function() {
        const placementsData = JSON.parse(buildAndGetPlacementInfo([
          mockBannerBid({}, { bidFloor: 1.2 }),
          mockBannerBid({}, { bidFloor: 0.7 }),
        ]));
        expect(placementsData[0].bidFloor).to.equal(1.2);
        expect(placementsData[1].bidFloor).to.equal(0.7);
      });

      it('should not write 0 bidfloor value by default', function() {
        const placementsData = JSON.parse(buildAndGetPlacementInfo([mockBannerBid()]));
        expect(placementsData[0].bidfloor).to.undefined;
      });

      it('should not exceed max url length', () => {
        const longString = Array(8000).join('a');
        const localWindow = utils.getWindowTop();

        const originalTitle = localWindow.document.title;
        localWindow.document.title = longString;

        const request = spec.buildRequests(
          [mockBannerBid()],
          mockBidderRequest({
            refererInfo: {
              numIframes: 1,
              reachedTop: true,
              referer: longString,
            },
          })
        )[0];
        const url = `${request.url}?${utils.parseQueryStringParameters(request.data)}`;

        expect(url.length).equal(8000);

        localWindow.document.title = originalTitle;
      });

      it('should only shortcut properties rather then completely remove it', () => {
        const longString = Array(8000).join('a');
        const localWindow = utils.getWindowTop();

        const originalTitle = localWindow.document.title;
        localWindow.document.title = `testtitle${longString}`;

        const request = spec.buildRequests(
          [mockBannerBid()],
          mockBidderRequest({
            refererInfo: {
              numIframes: 1,
              reachedTop: true,
              title: longString,
            },
          })
        )[0];

        expect(request.data.title.length).greaterThan(0);

        localWindow.document.title = originalTitle;
      });

      it('should add ats_envelope to banner bid request', function() {
        const envelope = 'test_envelope';
        const requests = build([mockBannerBid({}, { lr_env: envelope })]);

        expect(requests[0].data.ats_envelope).to.equal(envelope);
      });

      it('should add gpid to the banner bid request', function () {
        const bidArray = [mockBannerBid({
          ortb2Imp: {
            ext: { gpid: '/6355419/Travel/Europe/France/Paris' },
          }
        })];
        const placementInfo = buildAndGetPlacementInfo(bidArray);
        expect(placementInfo).to.include('"gpid":"/6355419/Travel/Europe/France/Paris"');
      });

      it('should add topics to the banner bid request', function () {
        const biddata = build([mockBannerBid()], mockBidderRequest({ortb2: { user: {
          data: [
            {
              ext: {
                segtax: 600,
                segclass: '2206021246',
              },
              segment: ['7', '8', '9'],
            },
          ],
        }}}));

        expect(biddata[0].data.topics).to.equal(JSON.stringify({
          taxonomy: 600,
          classifier: '2206021246',
          topics: [7, 8, 9],
        }));
      });

      it('should add cdep to the banner bid request', function () {
        const biddata = build(
          [mockBannerBid()],
          mockBidderRequest({
            ortb2: {
              device: {
                ext: {
                  cdep: 'test_cdep'
                },
              },
            },
          })
        );

        expect(biddata[0].data.cdep).to.equal(
          'test_cdep'
        );
      });

      it('should send gpc in the banner bid request', function () {
        const biddata = build(
          [mockBannerBid()],
          mockBidderRequest({
            ortb2: {
              regs: {
                ext: {
                  gpc: '1'
                },
              },
            },
          })
        );
        expect(biddata[0].data.gpc).to.equal('1');
      });

      it('should add eids to the banner bid request', function () {
        const params = {
          userIdAsEids: [{
            source: 'pubcid.org',
            uids: [
              {
                id: 'fake_pubcid',
                atype: 1,
              }
            ]
          }],
          fakeUserIdAsEids: [{
            source: 'pubcid.org',
            uids: [{
              id: 'fake_pubcid',
              atype: 1
            }]
          }]
        };
        expect(buildAndGetData([mockBannerBid({...params})]).eids).equal(JSON.stringify(params.fakeUserIdAsEids));
      });
    });

    describe('Instream video:', function () {
      let videoBid;
      const buildVideoBidAndGetVideoParam = () => build([videoBid])[0].data.imp[0].video;

      beforeEach(() => {
        videoBid = mockVideoBid();
      });

      it('should attempt to send video bid requests to the endpoint via POST', function () {
        const requests = build([videoBid]);
        expect(requests.length).to.equal(1);
        expect(requests[0].method).to.equal('POST');
        expect(requests[0].url).to.be.equal(VIDEO_ENDPOINT);
      });

      it('should not require params.video if required props in mediaTypes.video', function () {
        videoBid.mediaTypes.video = {
          ...videoBid.mediaTypes.video,
          ...videoBid.params.video
        };
        delete videoBid.params.video;
        const requests = build([videoBid]);
        expect(requests.length).to.equal(1);
        expect(requests[0].method).to.equal('POST');
        expect(requests[0].url).to.be.equal(VIDEO_ENDPOINT);
      });

      it('should add mediaTypes.video prop to the imp.video prop', function () {
        utils.deepAccess(videoBid, 'mediaTypes.video')['minduration'] = 40;
        expect(buildVideoBidAndGetVideoParam().minduration).to.equal(40);
      });

      it('should override mediaTypes.video prop if params.video prop is present', function () {
        utils.deepAccess(videoBid, 'mediaTypes.video')['minduration'] = 50;
        utils.deepAccess(videoBid, 'params.video')['minduration'] = 40;
        expect(buildVideoBidAndGetVideoParam().minduration).to.equal(40);
      });

      it('should add mediaTypes.video.mimes prop to the imp.video', function () {
        utils.deepAccess(videoBid, 'mediaTypes.video')['minduration'] = ['video/mp4'];
        expect(buildVideoBidAndGetVideoParam().minduration).to.deep.equal(['video/mp4']);
      });

      it('should add plcmt value to the imp.video', function () {
        const videoBid = mockVideoBid({}, {}, { plcmt: 1 });
        expect(utils.deepAccess(videoBid, 'params.video')['plcmt']).to.equal(1);
      });

      it('should add start delay if plcmt value is not 1', function () {
        const videoBid = mockVideoBid({}, {}, { plcmt: 2 });
        expect(build([videoBid])[0].data.imp[0].video.startdelay).to.equal(0);
      });

      it('should override mediaTypes.video.mimes prop if params.video.mimes is present', function () {
        utils.deepAccess(videoBid, 'mediaTypes.video')['mimes'] = ['video/mp4'];
        utils.deepAccess(videoBid, 'params.video')['mimes'] = ['video/mkv'];
        expect(buildVideoBidAndGetVideoParam().mimes).to.deep.equal(['video/mkv']);
      });

      describe('video.skip state check', () => {
        it('should not set video.skip if neither *.video.skip nor *.video.skippable is present', function () {
          utils.deepAccess(videoBid, 'mediaTypes.video')['skippable'] = false;
          utils.deepAccess(videoBid, 'params.video')['skippable'] = false;
          expect(buildVideoBidAndGetVideoParam().skip).to.undefined;
        });

        it('should set video.skip=1 if mediaTypes.video.skip is present', function () {
          utils.deepAccess(videoBid, 'mediaTypes.video')['skip'] = 1;
          expect(buildVideoBidAndGetVideoParam().skip).to.equal(1);
        });

        it('should set video.skip=1 if params.video.skip is present', function () {
          utils.deepAccess(videoBid, 'params.video')['skip'] = 1;
          expect(buildVideoBidAndGetVideoParam().skip).to.equal(1);
        });

        it('should set video.skip=1 if mediaTypes.video.skippable is present', function () {
          utils.deepAccess(videoBid, 'mediaTypes.video')['skippable'] = true;
          expect(buildVideoBidAndGetVideoParam().skip).to.equal(1);
        });

        it('should set video.skip=1 if mediaTypes.video.skippable is present', function () {
          utils.deepAccess(videoBid, 'params.video')['skippable'] = true;
          expect(buildVideoBidAndGetVideoParam().skip).to.equal(1);
        });

        it('should set video.skip=1 if mediaTypes.video.skippable is present', function () {
          utils.deepAccess(videoBid, 'mediaTypes.video')['skippable'] = false;
          utils.deepAccess(videoBid, 'params.video')['skippable'] = true;
          expect(buildVideoBidAndGetVideoParam().skip).to.equal(1);
        });

        it('should not set video.skip if params.video.skippable is false', function () {
          utils.deepAccess(videoBid, 'mediaTypes.video')['skippable'] = true;
          utils.deepAccess(videoBid, 'params.video')['skippable'] = false;
          expect(buildVideoBidAndGetVideoParam().skip).to.undefined;
        });
      });

      it('should process floors module if available', function () {
        const requests = build([
          mockVideoBid({...mockGetFloor(3.99)}),
          mockVideoBid({...mockGetFloor(1.23)}, { bidfloor: 1.1 }),
        ]);
        const imps = requests[0].data.imp;
        expect(imps[0].bidfloor).to.equal(3.99);
        expect(imps[1].bidfloor).to.equal(1.23);
      });

      it('should use bidfloor if no floors module is available', function() {
        const requests = build([
          mockVideoBid({}, { bidfloor: 1.2 }),
          mockVideoBid({}, { bidfloor: 0.7 }),
        ]);
        const imps = requests[0].data.imp;
        expect(imps[0].bidfloor).to.equal(1.2);
        expect(imps[1].bidfloor).to.equal(0.7);
      });

      it('should have 0 bidfloor value by default', function() {
        const requests = build([mockVideoBid()]);
        expect(requests[0].data.imp[0].bidfloor).to.equal(0);
      });

      it('should add ats_envelope to video bid request', function() {
        const envelope = 'test_envelope';
        const requests = build([mockVideoBid({}, { lr_env: envelope })]);

        expect(requests[0].data.ats_envelope).to.equal(envelope);
      });

      it('should add transaction id to video bid request', function() {
        const transactionId = '54a58774-7a41-494e-8cbc-fa7b79164f0c';
        const requestData = {
          ortb2Imp: {
            ext: {
              tid: '54a58774-7a41-494e-8cbc-fa7b79164f0c',
            }
          }
        };
        expect(buildAndGetData([mockVideoBid({...requestData})]).imp[0].ext.tid).to.equal(transactionId);
      });

      it('should add auction id to video bid request', function() {
        const auctionId = '1d1a03073455';
        expect(buildAndGetData([mockVideoBid({})]).auctionId).to.deep.equal(auctionId);
      });

      it('should add schain if it is in the bidRequest', () => {
        const schain = {
          ver: '1.0',
          complete: 1,
          nodes: [{
            asi: 'indirectseller.com',
            sid: '00001',
            hp: 1
          }],
        };
        expect(buildAndGetData([mockVideoBid({ortb2: {source: {ext: {schain}}}})]).schain).to.deep.equal(schain);
      });

      it('should add gpid to the video request', function () {
        const ortb2Imp = {
          ext: { gpid: '/6355419/Travel/Europe/France/Paris' },
        };
        expect(buildAndGetData([mockVideoBid({ortb2Imp})]).imp[0].ext.gpid).to.be.equal(ortb2Imp.ext.gpid);
      });

      it('should pass consent in video bid along with eids', () => {
        const params = {
          userIdAsEids: [
            {
              source: 'pubcid.org',
              uids: [
                {
                  id: 'fake_pubcid',
                  atype: 1,
                },
              ],
            },
          ],
          fakeUserIdAsEids: [
            {
              source: 'pubcid.org',
              uids: [
                {
                  id: 'fake_pubcid',
                  atype: 1,
                },
              ],
            },
          ],
        };
        const videoBidder = mockBidderRequest(
          {
            gdprConsent: {
              gdprApplies: 1,
              consentString: 'BOJ/P2HOJ/P2HABABMAAAAAZ+A==',
            },
          },
          [mockVideoBid()]
        );
        const payload = buildAndGetData([mockVideoBid({...params})], 0, videoBidder);
        expect(payload.user.ext.consent).to.equal('BOJ/P2HOJ/P2HABABMAAAAAZ+A==');
        expect(payload.user.ext.eids).to.eql(params.fakeUserIdAsEids);
      });

      it('should add eids to the video bid request', function () {
        const params = {
          userIdAsEids: [{
            source: 'pubcid.org',
            uids: [
              {
                id: 'fake_pubcid',
                atype: 1,
              }
            ]
          }],
          fakeUserIdAsEids: [{
            source: 'pubcid.org',
            uids: [{
              id: 'fake_pubcid',
              atype: 1
            }]
          }]
        };
        expect(buildAndGetData([mockVideoBid({...params})]).user.ext.eids).to.eql(params.fakeUserIdAsEids);
      });

      it('should add topics to the bid request', function () {
        const videoBidder = mockBidderRequest(
          {
            ortb2: {
              user: {
                data: [
                  {
                    ext: {
                      segtax: 600,
                      segclass: '2206021246',
                    },
                    segment: ['7', '8', '9'],
                  },
                ],
              },
            },
          },
          [mockVideoBid()]
        );
        const payload = buildAndGetData([mockVideoBid()], 0, videoBidder);
        expect(payload.topics).to.deep.equal({
          taxonomy: 600,
          classifier: '2206021246',
          topics: [7, 8, 9],
        });
      });

      it('should send gpc in the bid request', function () {
        const videoBidder = mockBidderRequest(
          {
            ortb2: {
              regs: {
                ext: {
                  gpc: '1',
                },
              },
            },
          },
          [mockVideoBid()]
        );
        const payload = buildAndGetData([mockVideoBid()], 0, videoBidder);
        expect(payload.regs.ext.gpc).to.equal('1');
      });

      it('should add device info to payload if available', function () {
        let videoBidder = mockBidderRequest({ ortb2: {
          device: {
            sua: {
              platform: {
                brand: 'macOS',
                version: [ '12', '4', '0' ]
              },
              browsers: [
                {
                  brand: 'Chromium',
                  version: [ '106', '0', '5249', '119' ]
                },
                {
                  brand: 'Google Chrome',
                  version: [ '106', '0', '5249', '119' ]
                },
                {
                  brand: 'Not;A=Brand',
                  version: [ '99', '0', '0', '0' ]
                }
              ],
              mobile: 0,
              model: '',
              bitness: '64',
              architecture: 'x86'
            }
          }
        }}, [mockVideoBid()]);
        let payload = buildAndGetData([mockVideoBid()], 0, videoBidder);
        expect(payload.device.sua).to.exist;
        expect(payload.device.sua).to.deep.equal({
          platform: {
            brand: 'macOS',
            version: [ '12', '4', '0' ]
          },
          browsers: [
            {
              brand: 'Chromium',
              version: [ '106', '0', '5249', '119' ]
            },
            {
              brand: 'Google Chrome',
              version: [ '106', '0', '5249', '119' ]
            },
            {
              brand: 'Not;A=Brand',
              version: [ '99', '0', '0', '0' ]
            }
          ],
          mobile: 0,
          model: '',
          bitness: '64',
          architecture: 'x86'
        }
        );
        expect(payload.device.ua).to.not.exist;
        expect(payload.device.language).to.not.exist;
        // remove sua info and check device object
        videoBidder = mockBidderRequest({ ortb2: {
          device: {
            ua: navigator.userAgent,
            language: (navigator.language || navigator.browserLanguage || navigator.userLanguage || navigator.systemLanguage),
          }
        }}, [mockVideoBid()]);
        payload = buildAndGetData([mockVideoBid()], 0, videoBidder);
        expect(payload.device.sua).to.not.exist;
        expect(payload.device.ua).to.exist;
        expect(payload.device.language).to.exist;
      });
    });
  });

  describe('interpretResponse', function () {
    const mockServerResponse = () => ({
      body: [{
        callback_id: '21989fdbef550a',
        cpm: 3.45455,
        publisherDealId: 'YMO_123',
        width: 300,
        height: 250,
        ad: '<html><head></head><body><script>//GEX ad object</script>' +
          '<div id="ym_123" class="ym"></div><script>//js code</script></body></html>',
        creative_id: '9874652394875',
        adomain: ['www.example.com'],
      }],
      header: 'header?',
    });

    it('should correctly reorder the server response', function () {
      const newResponse = spec.interpretResponse(mockServerResponse());
      expect(newResponse.length).to.be.equal(1);
      expect(newResponse[0]).to.deep.equal({
        dealId: 'YMO_123',
        requestId: '21989fdbef550a',
        cpm: 3.45455,
        width: 300,
        height: 250,
        creativeId: '9874652394875',
        currency: 'USD',
        netRevenue: true,
        ttl: 300,
        ad: '<html><head></head><body><script>//GEX ad object</script>' +
          '<div id="ym_123" class="ym"></div><script>//js code</script></body></html>',
        meta: {
          advertiserDomains: ['www.example.com'],
          mediaType: 'banner',
        },
      });
    });

    it('should correctly reorder video bids', function () {
      const response = mockServerResponse();
      const seatbid = [
        {
          bid: {
            adm: '<?xml version="1.0" encoding="UTF-8"?>',
            adomain: ['www.example.com'],
            crid: 'dd65c0a7536aff',
            impid: '91ea8bba1',
            price: 1.5,
            dealid: 'YMO_456'
          },
        },
      ];
      const bidRequest = {
        data: {
          imp: [
            {
              id: '91ea8bba1',
              video: {
                h: 250,
                w: 300,
              },
            },
          ],
        },
      };

      response.body.seatbid = seatbid;

      const newResponse = spec.interpretResponse(response, bidRequest);
      expect(newResponse.length).to.be.equal(2);
      expect(newResponse[1]).to.deep.equal({
        dealId: 'YMO_456',
        cpm: 1.5,
        creativeId: 'dd65c0a7536aff',
        currency: 'USD',
        height: 250,
        mediaType: 'video',
        meta: {
          advertiserDomains: ['www.example.com'],
          mediaType: 'video',
        },
        netRevenue: true,
        requestId: '91ea8bba1',
        ttl: 300,
        vastXml: '<?xml version="1.0" encoding="UTF-8"?>',
        width: 300,
      });
    });

    it('should not add responses if the cpm is 0 or null', function () {
      const response = mockServerResponse();
      response.body[0].cpm = 0;
      expect(spec.interpretResponse(response)).to.deep.equal([]);

      response.body[0].cpm = null;
      expect(spec.interpretResponse(response)).to.deep.equal([]);
    });
  });

  describe('getUserSync', function () {
    const gdprFlag = `&gdpr=0`;
    const usPrivacy = `us_privacy=`;
    const gdprString = `&gdpr_consent=`;
    const pbCookieAssistSyncUrl = `${PB_COOKIE_ASSIST_SYNC_ENDPOINT}?${usPrivacy}${gdprFlag}${gdprString}`;
    it('should use type iframe when iframeEnabled', function() {
      const syncs = spec.getUserSyncs({iframeEnabled: true});
      expect(syncs).to.deep.equal([{type: 'iframe', url: pbCookieAssistSyncUrl + '&type=iframe'}])
    });
    it('should use type image when pixelEnabled', function() {
      const syncs = spec.getUserSyncs({pixelEnabled: true});
      expect(syncs).to.deep.equal([{type: 'image', url: pbCookieAssistSyncUrl + '&type=image'}])
    });
    it('should register no syncs', function () {
      expect(spec.getUserSyncs({})).to.deep.equal([]);
    });
  });
});
