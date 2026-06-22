/**
 * CloudBase 批量导入脚本（浏览器控制台版）
 *
 * 使用方式：
 * 1. 打开 https://demand.sevenway.top（或本地部署地址）
 * 2. 按 F12 打开浏览器控制台
 * 3. 粘贴此脚本并回车执行
 *
 * 注意：需要先确保已匿名登录（平台会自动处理）
 */

(async function() {
    const demandsData = REPLACE_WITH_DATA;
    console.log(`待导入需求: ${demandsData.length} 条`);

    // 获取 CloudBase 实例
    const app = tcb.init({ env: 'cloud1-5g3f30lo8cd2237e' });
    const auth = app.auth({ persistence: 'local' });

    // 检查登录状态
    let loginState;
    try {
        loginState = auth.hasLoginState();
        if (!loginState) {
            console.log('未登录，尝试匿名登录...');
            loginState = await auth.signInAnonymously();
        }
        console.log('登录状态: 已登录');
    } catch (e) {
        console.error('登录失败:', e.message);
        return;
    }

    const db = app.database();
    const collection = db.collection('demands');

    // 查询现有数量
    const countRes = await collection.count();
    console.log(`现有数据量: ${countRes.total} 条`);

    let success = 0, fail = 0;

    for (let i = 0; i < demandsData.length; i++) {
        const demand = demandsData[i];
        try {
            await collection.add(demand);
            success++;
            console.log(`[${i + 1}/${demandsData.length}] ✓ ${demand.id} ${demand.title.substring(0, 40)}`);
        } catch (err) {
            fail++;
            console.error(`[${i + 1}/${demandsData.length}] ✗ ${demand.id}: ${err.message}`);
        }

        // 避免请求过快
        if (i % 5 === 4) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    console.log(`\n导入完成: 成功 ${success}, 失败 ${fail}`);
})();
