const config = require('./config');
const { getPathObj, getPathNum } = require("./getPathObj");
const { store } = require("./index");
const { isEmpty, addMT } = require('./lil_ops')
const { sortBuyArray } = require('./helpers');
const stringify = require('json-stable-stringify');

//the daily post, the inflation point for tokennomics
function dao(num) {
    return new Promise((resolve, reject) => {
        let post = `## SPK Network Daily Report\n`,
            news = '',
            daops = [],
            Pnews = new Promise(function(resolve, reject) {
                store.get(['postQueue'], function(err, obj) {
                    if (err) {
                        reject(err);
                    } else {
                        var news = isEmpty(obj) ? '' : '*****\n### News from Humans!\n';
                        for (var title in obj) { //postQueue[title].{title,text}
                            news = news + `#### ${title}\n`;
                            news = news + `${obj[title].text}\n\n`;
                        }
                        resolve(news);
                    }
                });
            }),
            Pbals = getPathObj(['balances']),
            Pcbals = getPathObj(['cbalances'])
            Prunners = getPathObj(['runners']),
            Pnodes = getPathObj(['markets', 'node']),
            Pstats = getPathObj(['stats']),
            Pdelegations = getPathObj(['delegations']),
            Pico = getPathObj(['auction']),
            Pdex = getPathObj(['dex']),
            Pbr = getPathObj(['br']),
            Ppbal = getPathNum(['gov', 't']),
            Pgov = getPathObj(['gov']),
            Pnomen = getPathObj(['nomention']),
            Pposts = getPathObj(['posts']),
            Pfeed = getPathObj(['feed']),
            Ppaid = getPathObj(['paid']),
            Pvals = getPathObj(['val']),
            Pgranting = getPathObj(['granting']),
            PcBroca = getPathObj(['cbroca']),
            PvBroca = getPathObj(['vbroca']),
            PSpk = getPathObj(['spk']),
            Pgranted = getPathObj(['granted']),
            Pservices = getPathObj(['services'])
        Promise.all([Pnews, Pbals, Prunners, Pnodes, Pstats, Pdelegations, Pico, Pdex, Pbr, Ppbal, Pnomen, Pposts, Pfeed, Ppaid, Pgranting, Pgranted, Pcbals, Pgov, Pvals, PcBroca, PSpk, PvBroca, Pservices]).then(function(v) {
            daops.push({ type: 'del', path: ['postQueue'] });
            daops.push({ type: 'del', path: ['br'] });
            daops.push({ type: 'del', path: ['rolling'] });
            daops.push({ type: 'del', path: ['auction'] });
            daops.push({ type: 'del', path: ['cBroca'] });
            daops.push({ type: 'del', path: ['vBroca'] });
            // daops.push({ type: 'del', path: ['markets', 'node'] })
            news = v[0] + '*****\n';
            const header = post + news;
            var bals = v[1],
                cbals = v[16],
                runners = v[2],
                mnode = v[3],
                stats = v[4],
                deles = v[5],
                ico = v[6],
                dex = v[7],
                br = v[8],
                powBal = v[9],
                nomention = v[10],
                cpost = v[11],
                feedCleaner = v[12],
                paidCleaner = v[13],
                granting = v[14];
                granted = v[15],
                gov = v[17],
                vals = v[18],
                cbroca = v[19],
                spk = v[20],
                vbroca = v[21],
                services = v[22]
            // for(var i = 0; i < dist.length;i++){
            //     if(dist[i][0].split('div:')[1]){
            //         addMT(['div', dist[i][0].split('div:')[1], 'b'], dist[i][1] )
            //     } else {
            //         cbals[dist[i][0]] ? cbals[dist[i][0]] += dist[i][1] : cbals[dist[i][0]] = dist[i][1]
            //     }
            // }
            feedKeys = Object.keys(feedCleaner);
            paidKeys = Object.keys(paidCleaner);
            for (feedi = 0; feedi < feedKeys.length; feedi++) {
                if (feedKeys[feedi].split(':')[0] < num - 30240) {
                    daops.push({ type: 'del', path: ['feed', feedKeys[feedi]] });
                }
            }
            for (paidi = 0; paidi < paidKeys.length; paidi++) {
                console.log(paidKeys[paidi])
                if (parseInt(paidKeys[paidi]) < num - 30240) {
                    console.log(paidKeys[paidi])
                    daops.push({ type: 'del', path: ['paid', paidKeys[paidi].toString()] });
                }
            }
            news = news;
            var i = 0,
                j = 0,
                b = 0,
                t = 0;
            t = parseInt(bals.ra);
            for (var node in runners) { //node rate
                b = parseInt(b) + parseInt(mnode?.[node].marketingRate) || 2500;
                j = parseInt(j) + parseInt(mnode?.[node].bidRate) || 2500;
                i++;
                console.log(b, j, i);
            }
            if (!i) {
                b = mnode[config.leader].marketingRate;
                j = mnode[config.leader].bidRate;
                i++;
            }
            // fast search array to get biggest values
            var new_vals = [], done = false
            stats.val_threshold = 0
            for(var code in vals){
                if (new_vals.length < parseInt(stats.validators)){
                    new_vals.push([vals[code], code])
                    if(new_vals.length == parseInt(stats.validators))new_vals = new_vals.sort((a, b) => a[0] - b[0] )
                } else if(vals[code] > new_vals[0][0]){
                    new_vals = new_vals.shift()
                    for(var i = 0; i < parseInt(stats.validators) - 2; i++){
                        if(vals[code] < new_vals[i][0]){
                            new_vals.splice(i, 0, [vals[code], code])
                            done = true
                            break
                        }
                    }
                    stats.val_threshold = new_vals[0][0]
                    if(!done)new_vals.push([vals[code], code])
                }
            }
            stats.marketingRate = parseInt(b / i);
            stats.nodeRate = parseInt(j / i);
            post = `![${config.TOKEN} Banner](${config.adverts[bals.ra % (config.adverts.length - 1)]})\n#### Daily Accounting\n`;
            post = post + `Total Supply: ${parseFloat(parseInt(stats.tokenSupply) / 1000).toFixed(3)} ${config.TOKEN}\n* ${parseFloat(parseInt(stats.tokenSupply - powBal - (bals.ra + bals.rc + bals.rd + bals.ri + bals.rn + bals.rm)) / 1000).toFixed(3)} ${config.TOKEN} liquid\n`;
            post = post + `* ${parseFloat(parseInt(powBal) / 1000).toFixed(3)} ${config.TOKEN} Locked to Govern\n`;
            post = post + `* ${parseFloat(parseInt(bals.ra + bals.rc + bals.rd + bals.ri + bals.rn + bals.rm) / 1000).toFixed(3)} ${config.TOKEN} in distribution accounts\n`;
            if(config.features.inflation)post = post + `${parseFloat(parseInt(t) / 1000).toFixed(3)} ${config.TOKEN} has been generated today. 5% APY.\n${parseFloat(stats.marketingRate / 10000).toFixed(4)} is the marketing rate.\n${parseFloat(stats.nodeRate / 10000).toFixed(4)} is the node rate.\n`;
            console.log(`DAO Accounting In Progress:\n${t} has been generated today\n${stats.marketingRate} is the marketing rate.\n${stats.nodeRate} is the node rate.`);
    // if collateral providers have less a penalty
    // this can also take in to account dex fees   
            const fees_collected = bals.rn
            bals.rn += parseInt(t * parseInt(stats.multiSigCollateral) / parseInt(stats.tokenSupply));
            bals.ra = parseInt(bals.ra) - parseInt(t * parseInt(stats.multiSigCollateral) / parseInt(stats.tokenSupply));
            //bals.rm += parseInt(t * stats.marketingRate / 10000);
            //if(stats.marketingRate)post = post + `${parseFloat(parseInt(t * stats.marketingRate / 10000) / 1000).toFixed(3)} ${config.TOKEN} moved to Marketing Allocation.\n`;
            // if (bals.rm > 1000000000) {
            //     bals.rc += bals.rm - 1000000000;
            //     post = post + `${parseFloat((bals.rm - 1000000000) / 1000).toFixed(3)} moved from Marketing Allocation to Content Allocation due to Marketing Holdings Cap of 1,000,000.000 ${config.TOKEN}\n`;
            //     bals.rm = 1000000000;
            // }
            //bals.ra = parseInt(bals.ra) - parseInt(t * stats.marketingRate / 10000);
            
            i = 0, j = 0;
            //if(bals.rm && config.features.inflation)post = post + `${parseFloat(parseInt(bals.rm) / 1000).toFixed(3)} ${config.TOKEN} is in the Marketing Allocation.\n`
            if(bals.rn)post = post + `##### Node Rewards\n`;
            console.log(num + `:${bals.rm} is availible in the marketing account\n${bals.rn} ${config.TOKEN} set aside to distribute to nodes`);
            stats.validators = {}
            for (var node in mnode) { //tally the wins
                j = j + parseInt(mnode[node].wins);
                mnode[node].votes = vals[mnode[node].val_code] || 0
                if(vals[mnode[node].val_code] >= stats.val_threshold)stats.validators[node] = vals[mnode[node].val_code]
            }
            b = bals.rn;
            function _atfun(node) {
                if (nomention[node]) {
                    return '@_';
                } else {
                    return '@';
                }
            }
            var newOwners = {}, dexfeea = 0, dexfeed = 1, dexmaxa = 0, dexslopea = 0, dexmaxd = 1, dexsloped = 1, dva = 0, dvd = 1
            if(j){
                for (var node in mnode) { //and pay them
                    const wins = mnode[node].wins
                    newOwners[node] = {wins}
                    mnode[node].tw = mnode[node].tw > 0 ? mnode[node].tw + wins : wins
                    mnode[node].wins = 0
                    mnode[node].ty = mnode[node].ty > 0 ? mnode[node].ty + mnode[node].yays : mnode[node].yays
                    mnode[node].yays = 0
                    const gbal = gov[node] || 0
                    i = parseInt(wins / j * b);
                    cbals[node] = cbals[node] ? cbals[node] += i : cbals[node] = i;
                    bals.rn -= i;
                    const _at = _atfun(node);
                    if (i) {
                        post = post + `* ${_at}${node} awarded ${parseFloat(i / 1000).toFixed(3)} ${config.TOKEN} for ${wins} credited transaction(s)\n`;
                        console.log(num + `:@${node} awarded ${parseFloat(i / 1000).toFixed(3)} ${config.TOKEN} for ${wins} credited transaction(s)`);
                    }
                }
            }
            
            for(var node in newOwners){
                newOwners[node].g = runners[node]?.g ? runners[node].g : 0;
            }
            var up_op = accountUpdate( stats, mnode, pick(newOwners) )
            function pick(noobj){
                var top = 0
                var topwin = 0
                var tops = []
                for (var node in noobj){
                    if(noobj[node].g > top){
                        top = noobj[node].g 
                    }
                    if(noobj[node].wins > topwin){
                        topwin = noobj[node].wins
                    }
                    if(noobj[node].wins)tops.push(noobj[node].g )
                }
                tops.sort((a,b)=>{return b-a})
                var thresh = tops[parseInt(tops.length/2) - 1]
                var sorting = [], out = []
                for (var node in noobj){
                    if(noobj[node].g >= thresh && noobj[node].wins >= (topwin * 90 / 100)){
                        sorting.push({node, g: noobj[node].g})
                    }
                }
                sorting.sort((a,b)=>{return b.g - a.g})
                for (var i = 0; i < sorting.length; i++){
                    out.push(sorting[i].node)
                }
                return out
            }
            //bals.rd += parseInt(t * stats.delegationRate / 10000); // 10% to delegators
            if(config.features.delegate){
                post = post + `### ${parseFloat(parseInt(bals.rd) / 1000).toFixed(3)} ${config.TOKEN} set aside for @${config.delegation} delegators\n`;
                bals.ra -= parseInt(t * stats.delegationRate / 10000);
                b = bals.rd;
                j = 0;
                console.log(num + `:${b} ${config.TOKEN} to distribute to delegators`);
                for (i in deles) { //count vests
                    j += deles[i];
                }
                for (i in deles) { //reward vests
                    k = parseInt(b * deles[i] / j);
                    cbals[i] ? cbals[i] += k : cbals[i] = k;
                    bals.rd -= k;
                    const _at = _atfun(i);
                    post = post + `* ${parseFloat(parseInt(k) / 1000).toFixed(3)} ${config.TOKEN} for ${_at}${i}'s ${parseFloat(deles[i] / 1000000).toFixed(1)} Mvests.\n`;
                    console.log(num + `:${k} ${config.TOKEN} awarded to ${i} for ${deles[i]} VESTS`);
                }
                stats[`${config.jsonTokenName}PerDel`] = parseFloat(k / j).toFixed(6);
            }
            if(config.features.ico){
                post = post + `*****\n`;

                // here we could find the price of the tokens and include either side of the DEX 
                    var dailyICODistrobution = bals.ra,
                        y = stats.inAuction;
                        //AMM here to settle DEX orders favorable to this price
                    post = post + `### LARYNX Auction Results:\n${parseFloat(dailyICODistrobution / 1000).toFixed(3)} LARYNX has been minted and purchased at ${parseFloat(y / 1000).toFixed(3)} HIVE today.\n`;
                    var auctionEntries = Object.keys(ico), iico = 0, ihive = 0
                    for (var node in ico) {
                        ihive += ico[node]
                        cbals[node] = cbals[node] ? cbals[node] + parseInt(ico[node] / y * dailyICODistrobution) :  parseInt(ico[node] / y * dailyICODistrobution);
                        dailyICODistrobution -= parseInt(ico[node] / y * dailyICODistrobution);
                        post = post + `* @${node} purchased  ${parseFloat(parseInt(ico[node] / y * dailyICODistrobution) / 1000).toFixed(3)} LARYNX\n`;
                        console.log(num + `:${node} purchased  ${parseInt(ico[node] / y * dailyICODistrobution)} LARYNX`);
                        if (iico == auctionEntries.length - 1) {
                            bals.ra = dailyICODistrobution
                        }
                    }
                    stats.hive_pool = ihive
                    dailyICODistrobution = 0;
                    ico = {}
            }
            var vol = 0,
                volhbd = 0,
                vols = 0,
                his = [],
                hisb = [],
                hi = {},
                hib = {};
            if(config.features.dex){
                for (var int in dex.hive.his) {
                    if (dex.hive.his[int].block < num - 60480) {
                        his.push(dex.hive.his[int]);
                        daops.push({ type: 'del', path: ['dex', 'hive', 'his', int] });
                    } else {
                        vol += parseInt(dex.hive.his[int].base_vol);
                        vols = parseInt(parseInt(dex.hive.his[int].target_vol) + vols);
                    }
                }
                for (var int in dex.hbd.his) {
                    if (dex.hbd.his[int].block < num - 60480) {
                        hisb.push(dex.hbd.his[int]);
                        daops.push({ type: 'del', path: ['dex', 'hbd', 'his', int] });
                    } else {
                        vol += parseInt(dex.hbd.his[int].base_vol);
                        volhbd = parseInt(parseInt(dex.hbd.his[int].target_vol)  + volhbd);
                    }
                }
                if (his.length) {
                    hi.o = parseFloat(his[0].price); // open, close, top bottom, dlux, volumepair
                    hi.c = parseFloat(his[his.length - 1].price);
                    hi.t = 0;
                    hi.b = hi.o;
                    hi.d = 0;
                    hi.v = 0;
                    for (var int = 0; int < his.length; int++) {
                        if (hi.t < parseFloat(his[int].price)) {
                            hi.t = parseFloat(his[int].price);
                        }
                        if (hi.b > parseFloat(his[int].price)) {
                            hi.b = parseFloat(his[int].price);
                        }

                        hi.v += parseInt(his[int].target_vol);
                        hi.d += parseInt(his[int].base_vol);
                    }
                    if (!dex.hive.days)
                        dex.hive.days = {};
                    dex.hive.days[num] = hi;
                }
                if (hisb.length) {
                    hib.o = parseFloat(hisb[0].price); // open, close, top bottom, dlux, volumepair
                    hib.c = parseFloat(hisb[hisb.length - 1].price);
                    hib.t = 0;
                    hib.b = hib.o;
                    hib.v = 0;
                    hib.d = 0;
                    for (var int = 0; int < hisb.length; int++) {
                        if (hib.t < parseFloat(hisb[int].price)) {
                            hib.t = parseFloat(hisb[int].price);
                        }
                        if (hib.b > parseFloat(hisb[int].price)) {
                            hib.b = parseFloat(hisb[int].price);
                        }
                        hib.v += parseInt(hisb[int].target_vol);
                        hib.d += parseInt(hisb[int].base_vol);
                    }
                    if (!dex.hbd.days)
                        dex.hbd.days = {};
                    dex.hbd.days[num] = hib;
                }
                let liqt = config.features.liquidity ? parseInt((bals.rm/365)*(stats.liq_reward/100)) : 0
                if (liqt > 0){
                    let liqa = 0
                    for (var acc in dex.liq){
                        liqa += parseInt(dex.liq[acc])
                    }
                    for (var acc in dex.liq){
                        thisd = parseInt(liqt*(dex.liq[acc]/liqa))
                        if (!bals[acc]) bals[acc] = 0;
                        bals[acc] += thisd;
                        bals.rm -= thisd;
                    }
                }
                delete dex.liq
                daops.push({type: 'del', path: ['dex', 'liq']})
                post = post + `*****\n### DEX Report\n#### Prices:\n* ${parseFloat(dex.hive.tick).toFixed(3)} HIVE per ${config.TOKEN}\n* ${parseFloat(dex.hbd.tick).toFixed(3)} HBD per ${config.TOKEN}\n#### Daily Volume:\n* ${parseFloat(vol / 1000).toFixed(3)} ${config.TOKEN}\n* ${parseFloat(vols / 1000).toFixed(3)} HIVE\n* ${parseFloat(parseInt(volhbd) / 1000).toFixed(3)} HBD\n*****\n`;
            }
            stats.movingWeight.dailyPool = bals.ra
            const inflationHedge = parseInt(( bals.ra * (gov.t / stats.tokenSupply))) // reward gov holders with inflation to balance inflationary forces
            bals.rn = bals.rn + inflationHedge
            stats.spk_interest_rate++
            bals.ra -= inflationHedge
            bals.rb += bals.ra
            bals.ra = 0
            var totBroca = 0
            var totC = 0
            for(var acc in cbroca){
                totBroca += typeof cbroca[acc] == "number" ? cbroca[acc] : 0
                totC += typeof cbals[acc] == "number" ? cbals[acc] : 0
            }
            for(var acc in vbroca){
                totBroca += typeof vbroca[acc] == "number" ? vbroca[acc] : 0
            }
            const oldEMA = stats.broca_daily_ema
            const oldDailyTrend = stats.broca_daily_trend
            stats.broca_daily_ema = parseInt((totBroca - oldEMA) * 0.1 + oldEMA) 
            stats.broca_daily_trend = parseInt(stats.broca_daily_ema - oldEMA) // use this number to increase or decrease the max broca size
            stats.utilization = parseInt((totBroca * 10000) / (spk.t * 100000) / stats.vals_target) // 51408 assumes 1/2 long tail rewards, 95.2% of checks accepted, and staking reawrds are equlized
            if(!stats.target_utilization)stats.target_utilization == stats.utilization * 2 //ramp up to target utilization
            else if (stats.target_utilization < 5000)stats.target_utilization += 10
            else if (stats.target_utilization > 5000)stats.target_utilization = 5000
            const diff = stats.utilization - stats.target_utilization
            if (diff > 500) { //utilization
                stats.spk_clawback = 0
                stats.spk_interest_rate = 50000 * (240 - parseInt(diff-500 / 20)) // Growing SPK Size comiserate with network utilization.
                if(stats.spk_interest_rate < 50000)stats.spk_interest_rate = 50000
            } else if(diff > -500 || stats.broca_daily_trend > - 100000){
                stats.spk_interest_rate = 100000 * 24 // Assumes Storage Size will double in 24 months.
                stats.spk_clawback = 0
            } else {
                stats.spk_interest_rate = totBroca + 1 // off
                stats.spk_clawback= parseInt(diff / -10) // .5% clawback minimum 5% maximum
            }
            var newSPK = parseInt(totBroca / stats.spk_interest_rate)
            spk.t += newSPK
            spk.u += newSPK //unissued
            const StakingRewards = parseInt(spk.u * stats.staking_rewards / 10000)
            var StakingDist = 0
            spk.u -= StakingRewards
            const StorageRewards = spk.u
            var StorageDist = 0
            var SpkShares = {}
            spk.u -= StorageRewards
            for (var acc in cbroca){
                const share = parseInt(StorageRewards * cbroca[acc] / totBroca)
                spk[acc] = spk[acc] ? spk[acc] + share : share
                SpkShares[acc] = share
                StorageDist += share
            }
            for (var acc in vbroca){
                const share = parseInt(StorageRewards * vbroca[acc] / totBroca)
                spk[acc] = spk[acc] ? spk[acc] + share : share
                StorageDist += share
            }
            spk.u = spk.u + StorageRewards - StorageDist
            for( var acc in SpkShares){
                const share = parseInt( StakingRewards * SpkShares[acc] / StorageDist) 
                const theirShare = parseInt((services[acc].s.c * 5)/(granted[acc].t + (services[acc].s.c * 5)) * share)
                const forDist = share - theirShare
                spk[acc] += theirShare
                var thisDist = theirShare
                for (var acc2 in granted[acc]){
                    spk[acc2] = spk[acc2] ? spk[acc2] + parseInt(forDist * granted[acc][acc2] / granted[acc].t) : parseInt(forDist * granted[acc][acc2] / granted[acc].t)
                    thisDist -= parseInt(forDist * granted[acc][acc2] / granted[acc].t)
                }
                spk.u += forDist - thisDist
            }
            //const BrocaPerSpk = spk.u > totBroca ? parseInt(spk.u / totBroca) : parseInt(totBroca / spk.u)
            //const SpkBig = spk.u > totBroca
            // const rewardBig = bals.rb > totBroca
            // const brocaPerMil = bals.rb > totBroca ? parseInt(bals.rb / totBroca) : parseInt(totBroca / bals.rb)
            
            // for(var acc in cbroca){
            //     //const fromMint = rewardBig ? parseInt(cbroca[acc] * brocaPerMil) : parseInt(brocaPerMil / cbroca[acc])
            //     const fromSPK = SpkBig ? parseInt(cbroca[acc] * BrocaPerSpk) : parseInt(BrocaPerSpk / cbroca[acc])
            //     //cbals[acc] = cbals[acc] ? cbals[acc] + fromMint : fromMint
            //     spk[acc] = spk[acc] ?  spk[acc] + fromSPK : fromSPK
            //     //bals.rb -= fromMint
            //     spk.u -= fromSPK
            //     //cbroca[acc] -= rewardBig ? parseInt( fromMint / brocaPerMil) : parseInt(brocaPerMil / fromMint)
            // }
            var q = 0,
                r = bals.rc;
            for (var i in br) {
                q += br[i].post.totalWeight;
            }
            var contentRewards = ``,
                vo = [];
            if (Object.keys(br).length) {
                bucket = parseInt(bals.rc / 200);
                bals.rc = bals.rc - bucket;
                contentRewards = `#### Top Paid Posts\n`;
                const compa = bucket;
                for (var i in br) {
                    var dif = bucket;
                    for (var j in br[i].post.voters) {
                        bals[br[i].post.author] += parseInt((br[i].post.voters[j].weight * 2 / q * 3) * compa);
                        cbals[br[i].post.author] ? cbals[br[i].post.author] += parseInt((br[i].post.voters[j].weight * 2 / q * 3) * compa) : cbals[br[i].post.author] = parseInt((br[i].post.voters[j].weight * 2 / q * 3) * compa);
                        bucket -= parseInt((br[i].post.voters[j].weight / q * 3) * compa);
                        cbals[br[i].post.voters[j].from] ? cbals[br[i].post.voters[j].from] += parseInt((br[i].post.voters[j].weight / q * 3) * compa) : cbals[br[i].post.voters[j].from] = parseInt((br[i].post.voters[j].weight / q * 3) * compa);
                        bucket -= parseInt((br[i].post.voters[j].weight * 2 / q * 3) * compa);
                    }
                    vo.push(br[i].post);
                    cpost[i] = {
                        v: br[i].post.voters.length,
                        d: parseFloat(parseInt(dif - bucket) / 1000).toFixed(3),
                    };
                    cpost[`s/${br[i].post.author}/${br[i].post.permlink}`] = cpost[i];
                    delete cpost[i];
                    contentRewards = contentRewards + `* [${br[i].post.title || `${config.TOKEN} Content`}](https://www.${config.mainFE}/@${br[i].post.author}/${br[i].post.permlink}) by @${br[i].post.author} awarded ${parseFloat(parseInt(dif - bucket) / 1000).toFixed(3)} ${config.TOKEN}\n`;
                }
                bals.rc += bucket;
                contentRewards = contentRewards + `\n*****\n`;
            }
            tw = 0,
                ww = 0,
                ii = 100, //max number of votes
                hiveVotes = '';
            for (var po = 0; po < vo.length; po++) {
                tw = tw + vo[po].totalWeight;
            }
            ww = parseInt(tw / 100000);
            vo = sortBuyArray(vo, 'totalWeight');
            if (vo.length < ii)
                ii = vo.length;
            for (var oo = 0; oo < ii; oo++) {
                var weight = parseInt(ww * vo[oo].totalWeight);
                if (weight > 10000)
                    weight = 10000;
                daops.push({
                    type: 'put',
                    path: ['escrow', config.delegation, `vote:${vo[oo].author}:${vo[oo].permlink}`],
                    data: [
                        "vote", {
                            "voter": config.delegation,
                            "author": vo[oo].author,
                            "permlink": vo[oo].permlink,
                            "weight": weight
                        }
                    ]
                });
                cpost[`s/${vo[oo].author}/${vo[oo].permlink}`].b = weight;
                hiveVotes = hiveVotes + `* [${vo[oo].title || `${config.TOKEN} Content`}](https://www.${config.mainFE}/@${vo[oo].author}/${vo[oo].permlink}) by @${vo[oo].author} | ${parseFloat(weight / 100).toFixed(2)}% \n`;
            }
            const footer = `[Visit ${config.mainFE}](https://${config.mainFE})\n[Visit our DEX/Wallet](https://${config.mainFE}/dex)\n[Read LightPaper](/@spknetwork/spk-network-light-paper)\n[Stop @ Mentions - HiveSigner](https://hivesigner.com/sign/custom-json?authority=posting&required_auths=0&id=${config.prefix}nomention&json=%7B%22nomention%22%3Atrue%7D)\n${config.footer}`;
            if (hiveVotes)
                hiveVotes = `#### Community Voted ${config.TOKEN} Posts\n` + hiveVotes + `*****\n`;
            post = header + contentRewards + hiveVotes + post + footer;
            var op = ["comment",
                {
                    "parent_author": "",
                    "parent_permlink": config.tag,
                    "author": config.leader,
                    "permlink": config.tag + num,
                    "title": `${config.TOKEN} DAO | Block Report ${num}`,
                    "body": post,
                    "json_metadata": JSON.stringify({
                        tags: [config.tag]
                    })
                }
            ];
            if(up_op){
                daops.push({ type: 'del', path: ['mso']});
                daops.push({ type: 'put', path: ['mso', `${num}:ac`], data: stringify(['account_update', up_op]) });
            }
            daops.push({ type: 'put', path: ['dex'], data: dex });
            daops.push({ type: 'put', path: ['stats'], data: stats });
            daops.push({ type: 'put', path: ['balances'], data: bals });
            daops.push({ type: 'put', path: ['cbalances'], data: cbals });
            daops.push({ type: 'put', path: ['cbroca'], data: cbroca });
            daops.push({ type: 'put', path: ['posts'], data: cpost });
            daops.push({ type: 'put', path: ['markets', 'node'], data: mnode });
            daops.push({ type: 'put', path: ['delegations'], data: deles });
            if(config.features.daily)daops.push({ type: 'put', path: ['escrow', config.leader, 'comment'], data: stringify(op) });
            for (var i = daops.length - 1; i >= 0; i--) {
                if (daops[i].type == 'put' && Object.keys(daops[i].data).length == 0 && typeof daops[i].data != 'number' && typeof daops[i].data != 'string') {
                    daops.splice(i, 1);
                }
            }
            for (var bali in bals) {
                if(bals[bali] == 0 && bali.length > 2) {
                    daops.push({ type: 'del', path: ['balances', bali] });
                }
            }
            store.batch(daops, [resolve, reject, num]);
        });
    });
}

exports.dao = dao;

function Distro(){
    return new Promise ((resolve, reject)=>{
        let Pbals = getPathObj(['balances']),
        Psets = getPathObj(['sets']),
        Pdiv = getPathObj(['div'])
        Promise.all([Pbals, Psets, Pdiv]).then(mem =>{
            let ops = [],
                bals = mem[0],
                sets = mem[1],
                div = mem[2],
                out = []
            for(var acc in bals) {
                if(acc.split('n:')[1]) {
                    out = [...out, ...preadd(bals[acc], sets[acc.split(':')[1]]), [acc, - bals[acc]]]
                }
            }
            out.sort((a, b) => a[0] - b[0])
            for(var i = 0; i < out.length - 1; i++) {
                if (out[i][0] == out[i + 1][0]) {
                    out[i+1][1] = out[i][1] + out[i+1][1]
                    out.splice(i, 1)
                    i--
                }
            }
            resolve(out)
        })
    })
    function preadd (bal, set){
        if(set.ra){
            let ret = [],
                accounts = set.ra.split(',')
                out = 0
            for (var i = 0; i < accounts.length - 1; i++) {
                t = parseInt((bal*accounts[i].split('_')[1])/10000)
                out += t
                ret.push([accounts[i].split('_')[0] == 'd' ? `div:${set.n}` : accounts[i].split('_')[0], t])
            }
            ret.push([accounts[accounts.length - 1].split('_')[0] == 'd' ? `div:${set.n}` : accounts[i].split('_')[0], bal - out])
            return ret
        } else {
            return [[set.a, bal]]
        }
    }
}

exports.Distro = Distro;

function Liquidity(){
    return new Promise ((resolve, reject)=>{
        let Pmarket = getPathObj(['dex'])
        Promise.all([Pmarket]).then(mem =>{
            let m = mem[0],
                hiveh = parseFloat(m.hive.buyBook.split('_')[0]),
                hbdh = parseFloat(m.hbd.buyBook.split('_')[0]),
                awards = {}
            if(!m.liq)m.liq = {}
            for (var item in m.hive.buyOrders){
                const acc = m.hive.buyOrders[item].from
                if(!awards[acc]) awards[acc] = 0
                awards[acc] += parseInt((parseFloat(m.hive.buyOrders[item].rate)/hiveh)*m.hive.buyOrders[item].hive)
            }
            for (var item in m.hbd.buyOrders){
                const acc = m.hbd.buyOrders[item].from
                if(!awards[acc]) awards[acc] = 0
                awards[acc] += parseInt((parseFloat(m.hbd.buyOrders[item].rate)/hbdh)*m.hbd.buyOrders[item].hbd)
            }
            for(var acc in awards) {
                if(!m.liq[acc])m.liq[acc] = 0
                m.liq[acc] += awards[acc]
            }
            if(Object.keys(m.liq).length)store.batch([{type: 'put', path: ['dex', 'liq'], data: m.liq}],[resolve, reject, 'liq_compound'])
            else resolve('no liq')
        })
    })
}
exports.Liquidity = Liquidity;
function accountUpdate(stats, nodes, arr){
    //get runners by gov balance
    //ensure have public key
    for (var i = 0; i < arr.length; i++) {
        if(!nodes[arr[i]].mskey){
        arr.splice(i, 1)
        i--
        }
    }
    var differrent = false
    for (var i = 0; i < arr.length; i++) {
        if(stats.ms.active_account_auths[arr[i]] != 1)differrent = true
    }
    if(!differrent || arr.length < 3)return //don't send duplicate updates, don't reduce key holders below 3
    if(arr.length > 40)arr = arr.slice(0,40)
    var updateOp = {
    "account": config.msaccount,
    "active": {
      "weight_threshold": parseInt(arr.length/2 + 1),
      "account_auths": [],
      "key_auths": []
    },
    "owner": {
      "weight_threshold": parseInt(arr.length/2 + 1),
      "account_auths": [],
      "key_auths": []
    },
    "posting": {
      "weight_threshold": 1,
      "account_auths": [[config.leader, 1]],
      "key_auths": []
    },
    "memo_key": config.msPubMemo,
    "json_metadata": stringify(config.msmeta)

  }
  for (var i = 0; i < arr.length; i++) {
    updateOp.active.account_auths.push([arr[i], 1])
    updateOp.owner.key_auths.push([nodes[arr[i]].mskey, 1])
  }
  return updateOp
}
