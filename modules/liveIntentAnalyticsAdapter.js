import { ajax } from '../src/ajax.js';
import { generateUUID } from '../src/utils.js';
import adapter from '../libraries/analyticsAdapter/AnalyticsAdapter.js';
import { EVENTS } from '../src/constants.js';
import adapterManager from '../src/adapterManager.js';
import { getRefererInfo } from '../src/refererDetection.js';
import { config as prebidConfig } from '../src/config.js';
import { auctionManager } from '../src/auctionManager.js';

const ANALYTICS_TYPE = 'endpoint';
const URL = 'https://wba.liadm.com/analytic-events';
const GVL_ID = 148;
const ADAPTER_CODE = 'liveintent';
const { AUCTION_INIT, BID_WON } = EVENTS;
const INTEGRATION_ID = '$$PREBID_GLOBAL$$';

let partnerIdFromUserIdConfig;
let sendAuctionInitEvents;

let liAnalytics = Object.assign(adapter({URL, ANALYTICS_TYPE}), {
  track({ eventType, args }) {
    switch (eventType) {
      case AUCTION_INIT:
        if (sendAuctionInitEvents) {
          handleAuctionInitEvent(args);
        }
        break;
      case BID_WON:
        handleBidWonEvent(args);
        break;
    }
  }
});

function handleAuctionInitEvent(auctionInitEvent) {
  const liveIntentIdsPresent = checkLiveIntentIdsPresent(auctionInitEvent.bidderRequests)

  // This is for old integration that enable or disable the user id module
  // dependeing on the result of rolling the dice outside of Prebid.
  const partnerIdFromAnalyticsLabels = auctionInitEvent.analyticsLabels?.partnerId;

  const data = {
    id: generateUUID(), // generated event id
    aid: auctionInitEvent.auctionId, // auction id
    u: getRefererInfo().page, // page URL
    ats: auctionInitEvent.timestamp, // timestamp of the auction
    pid: partnerIdFromUserIdConfig || partnerIdFromAnalyticsLabels, // partner id: distributor id or app id
    iid: INTEGRATION_ID, // integration id - e.g. the name of the prebid script's global variable
    tr: window.liTreatmentRate, // user id module treatment rate
    me: encodeBoolean(window.liModuleEnabled), // modbule enabled: decision that has been made according tp the configured treatment rate
    liip: encodeBoolean(liveIntentIdsPresent) // whether or not the LiveIntent IDs are present in one of the bid requests of the auction
  };
  const filteredData = ignoreUndefined(data);
  sendData('auction-init', filteredData);
}

function handleBidWonEvent(bidWonEvent) {
  const auction = auctionManager.index.getAuction({auctionId: bidWonEvent.auctionId});
  const liveIntentIdsPresent = checkLiveIntentIdsPresent(auction?.getBidRequests())

  // This is for old integration that enable or disable the user id module
  // dependeing on the result of rolling the dice outside of Prebid.
  const partnerIdFromAnalyticsLabels = bidWonEvent.analyticsLabels?.partnerId;

  const data = {
    id: generateUUID(), // generated event id
    aid: bidWonEvent.auctionId, // auction id
    u: getRefererInfo().page, // page URL
    ats: auction.timestamp, // auction timestamp
    auc: bidWonEvent.adUnitCode, // ad unit code
    auid: bidWonEvent.adUnitId, // ad unit id
    cpm: bidWonEvent.cpm, // CPM
    c: bidWonEvent.currency, // currency
    b: bidWonEvent.bidder, // bidder name
    bc: bidWonEvent.bidderCode, // bidder code
    pid: partnerIdFromUserIdConfig || partnerIdFromAnalyticsLabels, // partner id: distributor id or app id
    iid: INTEGRATION_ID, // integration id - e.g. the name of the prebid script's global variable
    sts: bidWonEvent.requestTimestamp, // timestamp of the bid request
    rts: bidWonEvent.responseTimestamp, // timestamp of the bid response
    tr: window.liTreatmentRate, // user id module treatment rate
    me: encodeBoolean(window.liModuleEnabled), // modbule enabled: decision that has been made according tp the configured treatment rate
    liip: encodeBoolean(liveIntentIdsPresent) // whether or not the LiveIntent IDs are present in one of the bid requests of the auction
  };
  const filteredData = ignoreUndefined(data);
  sendData('bid-won', filteredData);
}

function encodeBoolean(value) {
  return value === undefined ? undefined : value ? 'y' : 'n'
}

function checkLiveIntentIdsPresent(bidRequests) {
  const eids = bidRequests?.flatMap(r => r?.bids).flatMap(b => b?.userIdAsEids);
  return !!eids.find(eid => eid?.source === 'liveintent.com') || !!eids.flatMap(e => e?.uids).find(u => u?.ext?.provider === 'liveintent.com')
}

function sendData(path, data) {
  const fields = Object.entries(data);
  if (fields.length > 0) {
    const params = fields.map(([key, value]) => key + '=' + encodeURIComponent(value)).join('&');
    ajax(URL + '/' + path + '?' + params, undefined, null, { method: 'GET' });
  }
}

function ignoreUndefined(data) {
  const filteredData = Object.entries(data).filter(([key, value]) => value);
  return Object.fromEntries(filteredData);
}

// save the base class function
liAnalytics.originEnableAnalytics = liAnalytics.enableAnalytics;
// override enableAnalytics so we can get access to the config passed in from the page
liAnalytics.enableAnalytics = function (config) {
  const userIdModuleConfig = prebidConfig.getConfig('userSync.userIds').filter(m => m.name == 'liveIntentId')?.at(0)?.params
  partnerIdFromUserIdConfig = userIdModuleConfig?.liCollectConfig?.appId || userIdModuleConfig?.distributorId;
  sendAuctionInitEvents = config?.options.sendAuctionInitEvents;
  liAnalytics.originEnableAnalytics(config); // call the base class function
};

adapterManager.registerAnalyticsAdapter({
  adapter: liAnalytics,
  code: ADAPTER_CODE,
  gvlid: GVL_ID
});

export default liAnalytics;
