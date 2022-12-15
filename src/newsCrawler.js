// const axios = require("axios");
// const cheerio = require("cheerio"); 
// const fs = require('fs');
// const { title } = require("process");
// const prompt = require('prompt-sync')();
// // getting user input 
// userInp = prompt('Searching for: ');
// userInpCov =encodeURIComponent(userInp);
// userInpCov_crprank =userInp.replace(' ','-');
// offSetnumber_coindesk = 0;
// offSetnumber_crptrank = 0;
// // url from scraping sites 
// baseUrl_coindesk=`https://api.queryly.com/json.aspx?queryly_key=d0ab87fd70264c0a&query=${userInpCov}&endindex=${offSetnumber_coindesk}&batchsize=50&showfaceted=true&extendeddatafields=creator,creator_slug,subheadlines,primary_section,report_url,section_path,sections_paths,subtype,type,imageresizer,section,sponsored_label,sponsored,promo_image,pubDate&timezoneoffset=-420`
// baseUrl_cointele = 'https://graphcdn.cointelegraph.com/'
// baseLink_cointele = 'https://cointelegraph.com/news/'
// baseUrl_crprank = `https://api.cryptorank.io/v0/news?lang=en&&coinKeys=${userInpCov_crprank}&limit=50&offset=${offSetnumber_crptrank}`
// payload = {
//     "operationName": "SearchPagePostsQuery",
//     "variables": {
//       "short": "en",
//       "query": userInp,
//       "offset": 0,
//       "length": 10,
//       "cacheTimeInMS": 300000
//     },
//       "query": "query SearchPagePostsQuery($short: String = \"en\", $offset: Int!, $length: Int!, $query: String!) {\n  locale(short: $short) {\n    postsSearch(offset: $offset, length: $length, query: $query) {\n      data {\n        id\n        slug\n        views\n        postTranslate {\n          cacheKey\n          id\n          title\n          leadText\n          avatar\n          published\n          publishedHumanFormat\n          author {\n            cacheKey\n            id\n            slug\n            authorTranslates {\n              cacheKey\n              id\n              name\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        category {\n          cacheKey\n          id\n          slug\n          categoryTranslates {\n            cacheKey\n            id\n            title\n            __typename\n          }\n          __typename\n        }\n        author {\n          cacheKey\n          id\n          slug\n          authorTranslates {\n            cacheKey\n            id\n            name\n            __typename\n          }\n          __typename\n        }\n        postBadge {\n          cacheKey\n          id\n          label\n          postBadgeTranslates {\n            cacheKey\n            id\n            title\n            __typename\n          }\n          __typename\n        }\n        showShares\n        showStats\n        __typename\n      }\n      postsCount\n      hasMorePosts\n      __typename\n    }\n    __typename\n  }\n}\n"
// }
// resultArr =[];

// // function, object declaration 
// function NewsHeadlines(title, source, date) {
//   this.title = title;
//   this.source = source;
//   this.date = date;
// }

// function toTimestamp  (strDate){  
//     const dt = Date.parse(strDate);  
//     return dt / 1000;  
//     // console.log(toTimestamp('02/13/2020 23:31:30'));
// }  

// function compare ( a, b ) {
//     if ( a.date > b.date ){
//       return -1;
//     }
//     if ( a.date < b.date ){
//       return 1;
//     }
//     return 0;
//   }

// async function scrapeTheSite() {
//     // scraping from coindesk
//     res_coindesk = await axios.get(baseUrl_coindesk);  
//     pageData_coindesk = res_coindesk.data;
//     while (pageData_coindesk['items'].length>0) {
//         // console.log(offSetnumber)
//         arrData_coindesk = pageData_coindesk['items']
//         for (objData of arrData_coindesk) {
//             let newsData = new NewsHeadlines(objData['title'],'https://www.coindesk.com'+objData['link'],objData['pubdateunix'])
//             resultArr.push(newsData)
//           }
//         offSetnumber_coindesk += 50;
//         baseUrl_coindesk = `https://api.queryly.com/json.aspx?queryly_key=d0ab87fd70264c0a&query=${userInpCov}&endindex=${offSetnumber_coindesk}&batchsize=50&showfaceted=true&extendeddatafields=creator,creator_slug,subheadlines,primary_section,report_url,section_path,sections_paths,subtype,type,imageresizer,section,sponsored_label,sponsored,promo_image,pubDate&timezoneoffset=-420`
//         res_coindesk = await axios.get(baseUrl_coindesk);  
//         pageData_coindesk = res_coindesk.data;
//     }
//     // end of scracping from coindesk 

//     // scraping from cointelegraph
//     res_cointele = await axios.post(baseUrl_cointele,json=payload);  
//     pageData_cointele = res_cointele.data;
//     arrData_cointele = pageData_cointele['data']['locale']['postsSearch']['data']
//     while (arrData_cointele.length>0) {

//         for (objData of arrData_cointele) {
//             let newsData = new NewsHeadlines(objData['postTranslate']['title'],baseLink_cointele+objData['slug'], toTimestamp(objData['postTranslate']['published']))
//             resultArr.push(newsData)
//           }
//         payload['variables']['offset'] += 10;
//         res_cointele = await axios.post(baseUrl_cointele,json=payload);  
//         pageData_cointele = res_cointele.data;
//         arrData_cointele = pageData_cointele['data']['locale']['postsSearch']['data']
//     }
//     // end of scraping from cointelegraph

//     //scraping from cryptorank
//     res_crprank = await axios.get(baseUrl_crprank);  
//     pageData_crprank = res_crprank.data;
//     // console.log(pageData_crprank)
//     while (pageData_crprank['data'].length>0) {
//         // console.log(offSetnumber_crptrank)
//         arrData = pageData_crprank['data']
//         for (objData_crprank of arrData) {
//             // console.log(typeof(objData_crprank['title']))
//             let crpdate = objData_crprank['date']/1000
//             let newsData_crprank = new NewsHeadlines(objData_crprank['title'],objData_crprank['url'],crpdate)
//             resultArr.push(newsData_crprank)
//           }
//         offSetnumber_crptrank += 50;
//         baseUrl_crprank = `https://api.cryptorank.io/v0/news?lang=en&&coinKeys=${userInpCov_crprank}&limit=50&offset=${offSetnumber_crptrank}`
//         res_crprank = await axios.get(baseUrl_crprank);  
//         pageData_crprank = res_crprank.data;
//     }
//     // end of scraping from cryptorank 

//     // console.log(resultArr)
//     resultArr.sort(compare);
//     console.log(resultArr.length)
//     // log 10 latest news
//     for (let i = 0; i < 10; i++) {
//         console.log(resultArr[i]);        
//     }
// }

// scrapeTheSite();