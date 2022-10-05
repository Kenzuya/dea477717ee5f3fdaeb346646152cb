const { default: fetch } = require("node-fetch");
const cheerio = require("cheerio");
const UserAgent = require("user-agents");
const EasyDL = require("easydl");
const { default: axios } = require("axios");
const USER_COOKIE =
	"SEARCH_SAMESITE=CgQIr5YB; SID=OwjJS_G3HP75ok35D51m84FCmG4_9EMaYq8Rd4XlKEb_fm5SBXcreraqm-KA1VpC2J7RCw.; __Secure-1PSID=OwjJS_G3HP75ok35D51m84FCmG4_9EMaYq8Rd4XlKEb_fm5SjRYCHcGvynr6tOrm0BhcYA.; __Secure-3PSID=OwjJS_G3HP75ok35D51m84FCmG4_9EMaYq8Rd4XlKEb_fm5SmuifSaXT47-VCRNVc2ORGw.; HSID=Ad4YQe9dK7lszUiOe; SSID=ANk_uRyHR3xv6wLB4; APISID=0fq01nFsV5B4PhoX/AxEkA2x6qNZk3Fzgi; SAPISID=Or7_flv2WPSrGy3C/Ah3mLrQZGHrDSA5Ni; __Secure-1PAPISID=Or7_flv2WPSrGy3C/Ah3mLrQZGHrDSA5Ni; __Secure-3PAPISID=Or7_flv2WPSrGy3C/Ah3mLrQZGHrDSA5Ni; AEC=AakniGO4DsIoEpuJHlyKUiPmHEDZI3WmhwlEYrktwsHofxh2nkfXdevz5g; OTZ=6702777_28_28__28_; NID=511=ANJ0yqRY9Gm-ihFs8b2Z9OJidWCR8kh4w8-i1m0bY3Xhi6bv9OicQVf3u2JbDx75iTyEQyGzgrxXJ5WbralkR0Mw7bwH7sBL83Dk1pqMUb5SH66uvw66JNnG5DJRXjmYWxEzw94JZ3i_Ke18RyuIhi0oqA7W6q0h83-j4cYshvGq9_PEoeNkgLnyr4qaa1c4JMwFjj7ia2Dt0GFQ3KHJcABQOJg1kz8dmYN766CQPJu6X4PdnvcXc8bWw8rpsExlLZLQcIYKSlzn8C217IZM1lPWtVhQxiEYH8T00HL7EdR73NgqraB4ych32T3dINiqKFngNsCtVbXJLIDQOCpiV3pIs5KlZOBle3ZSSJ-u88o; 1P_JAR=2022-09-30-06; SIDCC=AEf-XMR4eAzeTA-HzH_nYNYWzHsCeu-TcSP-dojxXCLhxc9JPEnUnXSkXBo4ZUtdK7artIiGyTs; __Secure-1PSIDCC=AEf-XMQ68qLNqLffzzpUOC1Yf9ATJhqN68S47I6xDOJIUPWBT2PJxlboi4Rs-9zspdr4ujfJvMs; __Secure-3PSIDCC=AEf-XMQp4uLZVs-mhOOmCQoH4QwHN2DIgc3qvgYGNHe5S4Gilc1W-pwW6PVF-6qxiEICrF7b-Xg";
// async function getDriveDirectLinkV2(url) {}
// download('https://drive.google.com/uc?export=download&id=1jtcI5ffl7_oM1SE0k8iaxJT8vBqjPp13');

async function getDriveDirectLink(fileID) {
	try {
		const json = await (await fetch("https://www.bagusdl.pro/drive/direct.php?id=" + fileID)).json();
		// console.log(json);
		return json;
	} catch (err) {
		console.log(err);
		return err;
	}
}

async function getDriveDirectLinkV2(url, options) {
	const cookie =
		"SEARCH_SAMESITE=CgQIr5YB; SID=OwjJS_G3HP75ok35D51m84FCmG4_9EMaYq8Rd4XlKEb_fm5SBXcreraqm-KA1VpC2J7RCw.; __Secure-1PSID=OwjJS_G3HP75ok35D51m84FCmG4_9EMaYq8Rd4XlKEb_fm5SjRYCHcGvynr6tOrm0BhcYA.; __Secure-3PSID=OwjJS_G3HP75ok35D51m84FCmG4_9EMaYq8Rd4XlKEb_fm5SmuifSaXT47-VCRNVc2ORGw.; HSID=Ad4YQe9dK7lszUiOe; SSID=ANk_uRyHR3xv6wLB4; APISID=0fq01nFsV5B4PhoX/AxEkA2x6qNZk3Fzgi; SAPISID=Or7_flv2WPSrGy3C/Ah3mLrQZGHrDSA5Ni; __Secure-1PAPISID=Or7_flv2WPSrGy3C/Ah3mLrQZGHrDSA5Ni; __Secure-3PAPISID=Or7_flv2WPSrGy3C/Ah3mLrQZGHrDSA5Ni; OTZ=6702777_28_28__28_; NID=511=NEK-dge452HbUA4XaK5HF8RrTl9pDBXng3ettlSgceOdeakHqW-3M9Rxhbadq7bACK4D3uiKnx6INdv-zK7hchjulsoG_qNn6bJNqSQapN4QoZlBZimr7SE863De-3jD2xwK1gSqPHvrjnofzztRFA9rz7qRed3n4Q87Rl4DSbiXDtwWUJyFnR_Sn9xZzOnQbJ70D_JEqTHTifVMeyUZjZDDxBSp09DVPJzPtbr4IDUYFAWjL_688uC0Coz1qyW6JfQiuIM05kaMJFCm9MkRhTpg2fEZSiZ7-VI1W0tCz7Wls9Y1tramf0w2Np1-33SrkQdYGwj79-DzO6269EZ421uWf93zNtUnL0Q9Dq4bnaw; AEC=AakniGPbaeKzNa5fvZFCNT7GE3_dfrMLh-T3ZZg38qY8drvY054MCurQ-A; 1P_JAR=2022-10-04-09; SIDCC=AEf-XMS69sMe598Jt-DtP64FB0PxGPwfik4DDM1yGNPxCHnYAU7bZMff2Ec16301UaHx4rMct2g; __Secure-1PSIDCC=AEf-XMTdPH-pK2jQjBQBavCkknQD0rtQFTEtOaV4WoCtCsJrL0mcC1jLKdgYJQZPK89M3Dnaco4; __Secure-3PSIDCC=AEf-XMRmeR6sOFiblUuSZj9r4NMwkdYIFEnXhwwpbKk43jes9k5cmqe9K-iO_6uucO7lkEsTo9A";
	try {
		const { data: response } = await axios.get(url, options);
		const $ = cheerio.load(response);
		const link = $("#downloadForm").attr("action");
		const direct_url = link.replaceAll("amp;", "");
		console.log(direct_url);
		return direct_url;
	} catch (err) {
		if (typeof options === "object") {
			const keys = Object.keys(options);
			if (keys.includes("cookie")) return err;
			else {
				await getDriveDirectLinkV2(url, {
					headers: {
						cookie
					}
				});
			}
		} else
			await getDriveDirectLinkV2(url, {
				headers: {
					cookie
				}
			});
	}
}

// getDriveDirectLink('1v7T11KJ9FWQNwGDBfS5jK3yFozH8ZU47');

module.exports = { getDriveDirectLink, getDriveDirectLinkV2, USER_COOKIE };
