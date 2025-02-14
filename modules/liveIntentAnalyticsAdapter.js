import {ajax} from '../src/ajax.js';
import { generateUUID } from '../src/utils.js';
import adapter from '../libraries/analyticsAdapter/AnalyticsAdapter.js';
import { EVENTS } from '../src/constants.js';
import adapterManager from '../src/adapterManager.js';
import { getRefererInfo } from '../src/refererDetection.js';

const ANALYTICS_TYPE = 'endpoint';
const URL = 'https://wba.liadm.com/analytic-events';
const GVL_ID = 148;
const ADAPTER_CODE = 'liveintent';
const { AUCTION_INIT, BID_WON } = EVENTS;
const SCRIPT_ID = '$$PREBID_GLOBAL$$';

let partnerId;
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

function handleAuctionInitEvent(auctionEndEvent) {
  const data = {
    id: generateUUID(),
    aid: auctionEndEvent.auctionId,
    u: getRefererInfo().page,
    ts: auctionEndEvent.timestamp,
    pid: partnerId,
    sid: SCRIPT_ID,
  };
  const filteredData = ignoreUndefined(data);
  sendData('auction-init', filteredData);
}

function handleBidWonEvent(bidWonEvent) {
  const data = {
    id: generateUUID(),
    aid: bidWonEvent.auctionId,
    u: getRefererInfo().page,
    auc: bidWonEvent.adUnitCode,
    auid: bidWonEvent.adUnitId,
    cpm: bidWonEvent.cpm,
    c: bidWonEvent.currency,
    b: bidWonEvent.bidder,
    bc: bidWonEvent.bidderCode,
    pid: partnerId,
    sid: SCRIPT_ID,
    ts: bidWonEvent.requestTimestamp,
    rts: bidWonEvent.responseTimestamp
  };
  const filteredData = ignoreUndefined(data);
  sendData('bid-won', filteredData);
}

function sendData(path, data) {
  const fields = Object.entries(data);
  if (fields.length > 0) {
    const params = fields.map(([key, value]) => key + "=" + encodeURIComponent(value)).join('&');
    ajax(URL + '/' + path + '?' + params, undefined, null, { method: 'GET' });
  }
}

function ignoreUndefined(data) {
  const filteredData = Object.entries(data).filter(([key, value]) => value)
  return Object.fromEntries(filteredData)
}

// save the base class function
liAnalytics.originEnableAnalytics = liAnalytics.enableAnalytics;
// override enableAnalytics so we can get access to the config passed in from the page
liAnalytics.enableAnalytics = function (config) {
  partnerId = config?.options?.partnerId
  sendAuctionInitEvents = config?.options.sendAuctionInitEvents;
  liAnalytics.originEnableAnalytics(config); // call the base class function
};

adapterManager.registerAnalyticsAdapter({
  adapter: liAnalytics,
  code: ADAPTER_CODE,
  gvlid: GVL_ID
});

export default liAnalytics;
