"use strict";(self.webpackChunkwcpos=self.webpackChunkwcpos||[]).push([[5874],{3905:(e,t,r)=>{r.d(t,{Zo:()=>l,kt:()=>m});var o=r(7294);function n(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,o)}return r}function s(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){n(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function a(e,t){if(null==e)return{};var r,o,n=function(e,t){if(null==e)return{};var r,o,n={},i=Object.keys(e);for(o=0;o<i.length;o++)r=i[o],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(o=0;o<i.length;o++)r=i[o],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}var u=o.createContext({}),c=function(e){var t=o.useContext(u),r=t;return e&&(r="function"==typeof e?e(t):s(s({},t),e)),r},l=function(e){var t=c(e.components);return o.createElement(u.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},y=o.forwardRef((function(e,t){var r=e.components,n=e.mdxType,i=e.originalType,u=e.parentName,l=a(e,["components","mdxType","originalType","parentName"]),y=c(r),m=n,f=y["".concat(u,".").concat(m)]||y[m]||p[m]||i;return r?o.createElement(f,s(s({ref:t},l),{},{components:r})):o.createElement(f,s({ref:t},l))}));function m(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var i=r.length,s=new Array(i);s[0]=y;var a={};for(var u in t)hasOwnProperty.call(t,u)&&(a[u]=t[u]);a.originalType=e,a.mdxType="string"==typeof e?e:n,s[1]=a;for(var c=2;c<i;c++)s[c]=r[c];return o.createElement.apply(null,s)}return o.createElement.apply(null,r)}y.displayName="MDXCreateElement"},4119:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>u,contentTitle:()=>s,default:()=>p,frontMatter:()=>i,metadata:()=>a,toc:()=>c});var o=r(3117),n=(r(7294),r(3905));const i={title:"Security",description:"It is your responsibility to ensure the security of your customer's information"},s=void 0,a={unversionedId:"support/security",id:"version-0.4.x/support/security",title:"Security",description:"It is your responsibility to ensure the security of your customer's information",source:"@site/i18n/fr/docusaurus-plugin-content-docs/version-0.4.x/support/security.mdx",sourceDirName:"support",slug:"/support/security",permalink:"/fr/0.4.x/support/security",draft:!1,editUrl:"https://github.com/wcpos/docs/edit/main/versioned_docs/version-0.4.x/support/security.mdx",tags:[],version:"0.4.x",frontMatter:{title:"Security",description:"It is your responsibility to ensure the security of your customer's information"},sidebar:"mySidebar",previous:{title:"Debugging",permalink:"/fr/0.4.x/support/debugging"}},u={},c=[{value:"Use a SSL certificate",id:"use-a-ssl-certificate",level:3},{value:"Don&#39;t leave your POS unattended",id:"dont-leave-your-pos-unattended",level:3},{value:"Use the least number of plugins possible",id:"use-the-least-number-of-plugins-possible",level:3}],l={toc:c};function p(e){let{components:t,...r}=e;return(0,n.kt)("wrapper",(0,o.Z)({},l,r,{components:t,mdxType:"MDXLayout"}),(0,n.kt)("p",null,"WooCommerce POS allows payment using any installed ",(0,n.kt)("a",{parentName:"p",href:"http://www.woothemes.com/product-category/woocommerce-extensions/payment-gateways/"},"WooCommerce gateway"),". If the payment gateway collects personal information ",(0,n.kt)("strong",{parentName:"p"},"it is up to you")," to ensure the security of your customer's information. Below are some tips for keeping your POS secure:"),(0,n.kt)("h3",{id:"use-a-ssl-certificate"},"Use a SSL certificate"),(0,n.kt)("p",null,"If you are running an online store you should have a security certificate for your website.\nThis will ensure any form data you send, such as logins and credit card numbers, will be encrypted.\nIf you are not using a security certificate any information you send over the internet can be intercepted and read, this might be someone sharing your network or it could be at any one of the dozens of nodes that connects your computer to your server.\nA basic security certificate ",(0,n.kt)("a",{parentName:"p",href:"https://www.servertastic.com/rapidssl/"},"costs as little at $US16")," and takes less than a day to set up .. so there are no excuses for not having a security certificate."),(0,n.kt)("h3",{id:"dont-leave-your-pos-unattended"},"Don't leave your POS unattended"),(0,n.kt)("p",null,"Snooping over the internet is just one way your security can be compromised, but more often the real damage is done when a malicious user gets physical access to your device.\nThis is particularly pertinent to store owners who often leave their computer or tablet in high traffic areas.\nPlan for the worst case scenario that someone steals your computer or device and minimise the risk by employing some security measures, such as:"),(0,n.kt)("ul",null,(0,n.kt)("li",{parentName:"ul"},"Use a lock screen when your device is unattended for 5 or 10 minutes"),(0,n.kt)("li",{parentName:"ul"},"Log out of WordPress and WooCommerce POS when you leave your device"),(0,n.kt)("li",{parentName:"ul"},"Reset your passwords quickly in the event that your device is stolen"),(0,n.kt)("li",{parentName:"ul"},"Remote wipe your device in the event it is stolen")),(0,n.kt)("h3",{id:"use-the-least-number-of-plugins-possible"},"Use the least number of plugins possible"),(0,n.kt)("p",null,"One of the great things about WordPress is the 1,000's of plugins available at a click of a button ... but it's also one of the worst.\nEach time you install a plugin you are effectively granting that plugin access to your website and any data passing through it.\nI know it tempting to 'pimp' your store with every plugin under the sun, but quite often this will make your site slower and it may make your site insecure.\nBefore you install any plugin you should ask yourself:"),(0,n.kt)("ol",null,(0,n.kt)("li",{parentName:"ol"},"Do you really need it?"),(0,n.kt)("li",{parentName:"ol"},"Do you trust the plugin author?")),(0,n.kt)("p",null,"For more information on securing your WooCommerce store please read ",(0,n.kt)("a",{parentName:"p",href:"http://www.woothemes.com/2013/09/improve-your-wordpress-security-with-these-10-tips/"},"this great post")," on the WooThemes website."))}p.isMDXComponent=!0}}]);