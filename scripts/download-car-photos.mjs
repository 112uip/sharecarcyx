/**
 * 将 Wikimedia Commons 上的车辆实拍图下载到 frontend/public/cars/photos/
 * 运行：在项目根目录执行  node scripts/download-car-photos.mjs
 * 需可访问 upload.wikimedia.org（若在国内失败，请开代理或手动下载后放入 photos 目录）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../frontend/public/cars/photos')

// 8 辆车的 Wikimedia Commons 800px 缩略图（CC 许可）
const JOBS = [
  ['CAR-001', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/2023_BYD_Dolphin_Design_1.jpg/800px-2023_BYD_Dolphin_Design_1.jpg'],
  ['CAR-002', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/2018_Tesla_Model_3_Long_Range_RWD_Front_View.jpg/800px-2018_Tesla_Model_3_Long_Range_RWD_Front_View.jpg'],
  ['CAR-003', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/2022_GAC_Aion_Y_Plus.jpg/800px-2022_GAC_Aion_Y_Plus.jpg'],
  ['CAR-004', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/NIO_ET5_001.jpg/800px-NIO_ET5_001.jpg'],
  ['CAR-005', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Xpeng_P7_007.jpg/800px-Xpeng_P7_007.jpg'],
  ['CAR-006', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/2023_Lixiang_L8_%28front%29.jpg/800px-2023_Lixiang_L8_%28front%29.jpg'],
  ['CAR-007', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Mercedes-Maybach_S-Class_W223.jpg/800px-Mercedes-Maybach_S-Class_W223.jpg'],
  ['CAR-008', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Xiaomi_SU7_Max_2024.jpg/800px-Xiaomi_SU7_Max_2024.jpg'],
]

async function downloadOne(id, url) {
  const dest = path.join(outDir, `${id}.jpg`)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'CarShareDemo/1.0 (educational; +https://example.org)',
    },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${id}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 5000) {
    throw new Error(`file too small (${buf.length}b) for ${id}, likely not an image`)
  }
  fs.writeFileSync(dest, buf)
  console.log(`OK ${id} -> ${dest} (${buf.length} bytes)`)
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  for (const [id, url] of JOBS) {
    try {
      await downloadOne(id, url)
    } catch (e) {
      console.error(`FAIL ${id}:`, e.message)
    }
  }
  console.log('Done. Refresh the frontend after images are saved.')
}

main()
