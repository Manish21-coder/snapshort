export const SOURCE_MAP: Record<string, { subsources: string[]; mediums: string[] }> = {
  youtube:      { subsources: ["psci","pcom","psslc"],
                  mediums:    ["live","video","shorts","post","bio"] },

  telegramint:  { subsources: ["pbpsci","pbpcom","pbpsslc"],
                  mediums:    ["live","video","shorts","loop","post","story","reel","carousel"] },

  telegramext:  { subsources: ["psci","pcom","psslc"],
                  mediums:    ["live","video","shorts","loop","post","story","reel","carousel"] },

  instagram:    { subsources: ["psci","pcom","psslc"],
                  mediums:    ["live","video","shorts","loop","post","story","reel","carousel"] },

  appnotif:     { subsources: ["psci","pcom","psslc"],
                  mediums:    ["popup","push"] },

  seo:          { subsources: ["sslc","pu1sci","pu2sci","pu1com","pu2com"],
                  mediums:    ["blog","landingpage"] },

  meta:         { subsources: ["pscipu1","pscipu2","pcommpu1","pcommpu2",
                               "psslckannadamed","psslcenglishmed","pninth","pcomm","psci"],
                  mediums:    ["leadgenform","walkin","conversion","subscribe",
                               "app install","leadgenlandingpage","followus",
                               "live link","skippable_ad","not skippable_ad"] },

  google:       { subsources: ["pscipu1","pscipu2","pcommpu1","pcommpu2",
                               "psslckannadamed","psslcenglishmed","pninth","pcomm","psci"],
                  mediums:    ["leadgenform","walkin","conversion","subscribe",
                               "app install","leadgenlandingpage","followus",
                               "live link","skippable_ad","not skippable_ad"] },

  yt_promote:   { subsources: ["pscipu1","pscipu2","pcommpu1","pcommpu2",
                               "psslckannadamed","psslcenglishmed","pninth","pcomm","psci"],
                  mediums:    ["leadgenform","walkin","conversion","subscribe",
                               "app install","leadgenlandingpage","followus",
                               "live link","skippable_ad","not skippable_ad"] },

  ig_boosting:  { subsources: ["pscipu1","pscipu2","pcommpu1","pcommpu2",
                               "psslckannadamed","psslcenglishmed","pninth","pcomm","psci"],
                  mediums:    ["leadgenform","walkin","conversion","subscribe",
                               "app install","leadgenlandingpage","followus",
                               "live link","skippable_ad","not skippable_ad"] },

  crm_outbound: { subsources: ["bulk_offer_msg","live_reminder_msg","result_followup_msg",
                               "failed_payment_followup","buy_now_clicker_followup"],
                  mediums:    ["whatsapp_niaa","whatsapp_manual","echo","whatsapp_bulk"] },

  crm_inbound:  { subsources: ["echo_inbound","niaa_reply","walkin_intent",
                               "direct_whatsapp_message"],
                  mediums:    ["whatsapp_niaa","whatsapp_manual","echo"] },
};

export const SOURCE_OPTIONS = Object.keys(SOURCE_MAP);
