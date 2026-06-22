#!/usr/bin/env node
/**
 * CloudBase 批量导入脚本（HTTP API 方式）
 * 使用匿名登录获取 token，然后批量插入数据
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ENVID = 'cloud1-5g3f30lo8cd2237e';
const COLLECTION = 'demands';

function httpPost(url, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(data);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                ...headers
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (e) { resolve(body); }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function getAnonymousToken() {
    const url = `https://${ENVID}.api.tencentyun.com/auth/v2/anonymous/login`;
    const res = await httpPost(url, {
        env: ENVID
    });
    if (res.access_token) {
        return res.access_token;
    }
    throw new Error(`匿名登录失败: ${JSON.stringify(res)}`);
}

async function insertDemand(token, demand) {
    const url = `https://${ENVID}.api.tencentyun.com/database/v1/collections/${COLLECTION}/documents`;
    const res = await httpPost(url, {
        document: demand
    }, {
        'Authorization': `Bearer ${token}`,
        'x-tcb-env': ENVID
    });
    return res;
}

async function main() {
    const jsonPath = process.argv[2] || path.join(__dirname, '..', 'demand-migration-data.json');

    if (!fs.existsSync(jsonPath)) {
        console.error(`JSON 文件不存在: ${jsonPath}`);
        process.exit(1);
    }

    const demands = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`待导入需求: ${demands.length} 条`);

    try {
        // 1. 获取匿名 token
        console.log('正在获取匿名登录凭证...');
        const token = await getAnonymousToken();
        console.log('获取凭证成功');

        // 2. 批量插入
        let success = 0, fail = 0;

        for (let i = 0; i < demands.length; i++) {
            const demand = demands[i];
            process.stdout.write(`[${i + 1}/${demands.length}] ${demand.id} ${demand.title.substring(0, 30)}... `);

            try {
                const res = await insertDemand(token, demand);
                if (res.id || res._id) {
                    success++;
                    console.log('✓');
                } else {
                    fail++;
                    console.log(`✗ ${JSON.stringify(res).substring(0, 100)}`);
                }
            } catch (err) {
                fail++;
                console.log(`✗ ${err.message}`);
            }

            // 避免请求过快
            if (i % 10 === 9) {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        console.log(`\n导入完成: 成功 ${success}, 失败 ${fail}`);

    } catch (err) {
        console.error('导入失败:', err.message);
        console.log('\n如果匿名登录失败，请确保 CloudBase 控制台已开启匿名登录能力');
        console.log('路径: CloudBase 控制台 → 环境 → 登录授权 → 匿名登录 → 开启');
    }
}

main().catch(console.error);
