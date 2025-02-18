import {ajax} from '../src/ajax.js';
import { generateUUID } from '../src/utils.js';
import adapter from '../libraries/analyticsAdapter/AnalyticsAdapter.js';
import { EVENTS } from '../src/constants.js';
import adapterManager from '../src/adapterManager.js';
import { getRefererInfo } from '../src/refererDetection.js';
import { config as prebidConfig} from '../src/config.js';
import {getGlobal} from 'src/prebidGlobal.js';
import { auctionManager } from '../src/auctionManager.js';

const ANALYTICS_TYPE = 'endpoint';
const URL = 'https://wba.liadm.com/analytic-events';
const GVL_ID = 148;
const ADAPTER_CODE = 'liveintent';
const { AUCTION_INIT, BID_WON } = EVENTS;
const INTEGRATION_ID = '$$PREBID_GLOBAL$$';

let partnerId;
let sendAuctionInitEvents;
let treatmentRate;

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

function handleAuctionInitEvent(auctionEndEvent) {
  const liveIntentIdsPresent = checkLiveIntentIdsPresent(auctionEndEvent.bidderRequests)

  const data = {
    id: generateUUID(), // generated event id
    aid: auctionEndEvent.auctionId, // auction id
    u: getRefererInfo().page, // page URL
    ts: auctionEndEvent.timestamp, // timestamp of the auction
    pid: partnerId, // partner id: distributor id or app id
    iid: INTEGRATION_ID, // integration id - e.g. the name of the prebid script's global variable
    tr: treatmentRate, // user id module treatment rate
    me: encodeBoolean(auctionEndEvent.analyticsLabels?.liModuleEnabled), // modbule enabled: decision that has been made according tp the configured treatment rate
    liip: encodeBoolean(liveIntentIdsPresent) // whether or not the LiveIntent IDs are present in one of the bid requests of the auction
  };
  const filteredData = ignoreUndefined(data);
  sendData('auction-init', filteredData);
}

function handleBidWonEvent(bidWonEvent) {
  const auction = auctionManager.index.getAuction({auctionId: bidWonEvent.auctionId});
  const liveIntentIdsPresent = checkLiveIntentIdsPresent(auction?.getBidRequests())

  const data = {
    id: generateUUID(), // generated event id
    aid: bidWonEvent.auctionId, // auction id
    u: getRefererInfo().page, // page URL
    auc: bidWonEvent.adUnitCode, // ad unit code
    auid: bidWonEvent.adUnitId, // ad unit id
    cpm: bidWonEvent.cpm, // CPM
    c: bidWonEvent.currency, // currency
    b: bidWonEvent.bidder, // bidder name
    bc: bidWonEvent.bidderCode, // bidder code
    pid: partnerId, // partner id: distributor id or app id
    iid: INTEGRATION_ID, // integration id - e.g. the name of the prebid script's global variable
    ts: bidWonEvent.requestTimestamp, // timestamp of the bid request 
    rts: bidWonEvent.responseTimestamp, // timestamp of the bid response
    tr: treatmentRate, // user id module treatment rate
    me: encodeBoolean(bidWonEvent.analyticsLabels?.liModuleEnabled), // modbule enabled: decision that has been made according tp the configured treatment rate
    liip: encodeBoolean(liveIntentIdsPresent) // whether or not the LiveIntent IDs are present in one of the bid requests of the auction
  };
  const filteredData = ignoreUndefined(data);
  sendData('bid-won', filteredData);
}

function encodeBoolean(value) {
  return value === undefined ? undefined  : value ? "y" : "n"
}

function checkLiveIntentIdsPresent(bidRequests) {
  const eids = bidRequests?.flatMap(r => r?.bids).flatMap(b => b?.userIdAsEids);
  return !!eids.find(eid => eid?.source === "liveintent.com")  || eids.flatMap(e => e?.uids).find(u => u?.ext?.provider === "liveintent.com")
}

function sendData(path, data) {
  const fields = Object.entries(data);
  if (fields.length > 0) {
    const params = fields.map(([key, value]) => key + "=" + encodeURIComponent(value)).join('&');
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
  partnerId = userIdModuleConfig?.liCollectConfig?.appId || userIdModuleConfig?.distributorId;
  sendAuctionInitEvents = config?.options.sendAuctionInitEvents;
  treatmentRate = userIdModuleConfig?.treatmentRate;
  liAnalytics.originEnableAnalytics(config); // call the base class function
};

adapterManager.registerAnalyticsAdapter({
  adapter: liAnalytics,
  code: ADAPTER_CODE,
  gvlid: GVL_ID
});

export default liAnalytics;
