# Overview

Module Name: LiveIntent Provider
Module Type: Rtd Provider
Maintainer: product@liveintent.com

# Description

This module extracts segments from `bidRequest.userId.lipbid.segments` enriched by the userID module and
move them as part of the `ortb2.user.data` array entry. 

please contact [product@liveintent.com](contact@adagio.io) for more information.

# Integration

```bash
gulp build --modules=userId,liveIntentIdSystem,rtdModule,liveintentRtdProvider
```

```javascript
pbjs.setConfig({
  realTimeData: {
    dataProviders:[{
      name: 'liveintent.com'
    }]
  }
});
```
