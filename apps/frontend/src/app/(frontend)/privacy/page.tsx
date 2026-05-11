/**
 * Privacy Policy (PDPA-compliant, bilingual TH/EN)
 *
 * Why this page matters:
 *   - Thailand's Personal Data Protection Act B.E. 2562 (2019)
 *     requires a publicly accessible policy stating:
 *       (a) categories of personal data collected
 *       (b) purpose and legal basis for processing
 *       (c) retention period
 *       (d) rights of the data subject
 *       (e) contact point for the Data Controller
 *   - Stripe + GDPR-aware partners will refuse integration
 *     without this page.
 *
 * Sections are side-by-side TH/EN to mirror the ToS page and
 * avoid silent drift between language versions.
 */

import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Got Journey Thailand',
  description:
    'นโยบายความเป็นส่วนตัว Got Journey Thailand ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) — Privacy Policy and PDPA-compliant disclosures.',
}

const LAST_UPDATED_TH = '11 พฤษภาคม 2569'
const LAST_UPDATED_EN = 'May 11, 2026'

interface Section {
  title: { th: string; en: string }
  th: string[]
  en: string[]
}

const sections: Section[] = [
  {
    title: { th: '1. ผู้ควบคุมข้อมูลส่วนบุคคล', en: '1. Data Controller' },
    th: [
      'Got Journey Thailand (ต่อไปนี้เรียกว่า "เรา") เป็นผู้ควบคุมข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
      'ท่านสามารถติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO) ได้ที่ privacy@gotjourneythailand.com',
    ],
    en: [
      'Got Journey Thailand ("we", "us") is the Data Controller under Thailand\'s Personal Data Protection Act B.E. 2562 (2019).',
      'You may contact our Data Protection Officer (DPO) at privacy@gotjourneythailand.com.',
    ],
  },
  {
    title: { th: '2. ข้อมูลที่เราเก็บรวบรวม', en: '2. Information We Collect' },
    th: [
      'ข้อมูลที่ท่านให้โดยตรง:',
      '• ชื่อ-นามสกุล อีเมล เบอร์โทรศัพท์',
      '• ข้อมูลการจอง (วันที่เช็คอิน/เช็คเอาท์, จำนวนผู้เข้าพัก)',
      '• ข้อความรีวิว (หากท่านเลือกที่จะรีวิว)',
      'ข้อมูลที่เก็บอัตโนมัติ:',
      '• IP address, ประเภทเบราว์เซอร์, ระบบปฏิบัติการ',
      '• ข้อมูลการใช้งาน (หน้าที่เปิด, เวลาที่เปิด)',
      'ข้อมูลที่เราไม่เก็บ:',
      '• หมายเลขบัตรเครดิต (Stripe เป็นผู้จัดเก็บโดยตรง)',
      '• รหัสผ่านในรูปแบบ plain text (เราเก็บเฉพาะ hash)',
    ],
    en: [
      'Information you provide directly:',
      '• Full name, email, phone number',
      '• Booking details (check-in/out dates, number of guests)',
      '• Review text (if you choose to post one)',
      'Information collected automatically:',
      '• IP address, browser type, operating system',
      '• Usage data (pages visited, timestamps)',
      'Information we do NOT collect:',
      '• Credit card numbers (stored directly by Stripe)',
      '• Plain-text passwords (we store only hashed values)',
    ],
  },
  {
    title: { th: '3. วัตถุประสงค์ในการใช้ข้อมูล', en: '3. Purpose of Processing' },
    th: [
      '• เพื่อประมวลผลและยืนยันการจอง (ฐาน: ปฏิบัติตามสัญญา)',
      '• เพื่อติดต่อสื่อสารเกี่ยวกับการจอง (ฐาน: ปฏิบัติตามสัญญา)',
      '• เพื่อออกใบเสร็จและใบกำกับภาษี (ฐาน: ปฏิบัติตามกฎหมาย)',
      '• เพื่อวิเคราะห์และปรับปรุงบริการ (ฐาน: ประโยชน์โดยชอบด้วยกฎหมาย)',
      '• เพื่อส่งข่าวสารทางการตลาด (ฐาน: ความยินยอม — ท่านยกเลิกได้ตลอดเวลา)',
    ],
    en: [
      '• To process and confirm bookings (legal basis: contract)',
      '• To communicate about your bookings (legal basis: contract)',
      '• To issue receipts and tax invoices (legal basis: legal obligation)',
      '• To analyze and improve our service (legal basis: legitimate interest)',
      '• To send marketing communications (legal basis: consent — opt-out anytime)',
    ],
  },
  {
    title: { th: '4. การเปิดเผยข้อมูลให้บุคคลที่สาม', en: '4. Sharing with Third Parties' },
    th: [
      'เราเปิดเผยข้อมูลเท่าที่จำเป็นกับ:',
      '• พาร์ทเนอร์ที่พัก/รถเช่า (เพื่อให้บริการตามการจอง)',
      '• Stripe (เพื่อประมวลผลการชำระเงิน)',
      '• Resend / Brevo (เพื่อจัดส่งอีเมลยืนยัน)',
      '• Supabase (ผู้ให้บริการฐานข้อมูล)',
      '• หน่วยงานราชการ (เมื่อกฎหมายกำหนด)',
      'เราไม่ขายข้อมูลส่วนบุคคลของท่านให้บุคคลที่สาม',
    ],
    en: [
      'We share information only as necessary with:',
      '• Accommodation / car rental partners (to fulfill bookings)',
      '• Stripe (payment processing)',
      '• Resend / Brevo (confirmation emails)',
      '• Supabase (database hosting)',
      '• Government authorities (when legally required)',
      'We do NOT sell your personal information to third parties.',
    ],
  },
  {
    title: { th: '5. การถ่ายโอนข้อมูลระหว่างประเทศ', en: '5. International Data Transfer' },
    th: [
      'ผู้ให้บริการบางรายตั้งอยู่นอกประเทศไทย (เช่น Stripe ในสหรัฐอเมริกา, Supabase ในสิงคโปร์)',
      'เราดำเนินการโดยมีมาตรการคุ้มครองที่เหมาะสม ได้แก่ Standard Contractual Clauses และ DPA (Data Processing Agreement)',
    ],
    en: [
      'Some service providers are located outside Thailand (e.g., Stripe in the US, Supabase in Singapore).',
      'We ensure appropriate safeguards are in place, including Standard Contractual Clauses and Data Processing Agreements (DPAs).',
    ],
  },
  {
    title: { th: '6. ระยะเวลาการเก็บข้อมูล', en: '6. Data Retention' },
    th: [
      '• ข้อมูลการจอง: 10 ปี (ตามกฎหมายภาษีและบัญชี)',
      '• ข้อมูลบัญชีผู้ใช้: ตราบที่ยังใช้งาน + 3 ปีหลังยกเลิก',
      '• Log การเข้าใช้งาน: 90 วัน',
      '• รีวิว: ตลอดระยะเวลาที่เว็บไซต์ให้บริการ เว้นแต่ท่านขอลบ',
    ],
    en: [
      '• Booking records: 10 years (tax and accounting law)',
      '• User account data: while active + 3 years after deletion',
      '• Access logs: 90 days',
      '• Reviews: for the lifetime of the website, unless you request deletion',
    ],
  },
  {
    title: { th: '7. สิทธิของเจ้าของข้อมูล', en: '7. Your Rights' },
    th: [
      'ตาม PDPA ท่านมีสิทธิดังนี้:',
      '• สิทธิขอเข้าถึงและขอสำเนาข้อมูล',
      '• สิทธิขอให้แก้ไขข้อมูลที่ไม่ถูกต้อง',
      '• สิทธิขอให้ลบข้อมูล (สิทธิที่จะถูกลืม)',
      '• สิทธิขอให้ระงับการใช้ข้อมูล',
      '• สิทธิคัดค้านการประมวลผลข้อมูล',
      '• สิทธิขอโอนย้ายข้อมูล',
      '• สิทธิเพิกถอนความยินยอม',
      'ส่งคำร้องได้ที่ privacy@gotjourneythailand.com — เราจะตอบกลับภายใน 30 วัน',
    ],
    en: [
      'Under PDPA, you have the right to:',
      '• Access and obtain a copy of your data',
      '• Correct inaccurate data',
      '• Request data deletion (right to be forgotten)',
      '• Restrict processing',
      '• Object to processing',
      '• Data portability',
      '• Withdraw consent',
      'Submit requests to privacy@gotjourneythailand.com — we respond within 30 days.',
    ],
  },
  {
    title: { th: '8. คุกกี้ (Cookies)', en: '8. Cookies' },
    th: [
      'เราใช้คุกกี้เพื่อ:',
      '• รักษาสถานะการเข้าสู่ระบบ (คุกกี้จำเป็น)',
      '• ป้องกัน CSRF attack (คุกกี้จำเป็น)',
      '• จดจำภาษาที่ท่านเลือก (คุกกี้เพื่อประสบการณ์)',
      '• วิเคราะห์การใช้งาน (คุกกี้วิเคราะห์ — ต้องขอความยินยอม)',
      'ท่านสามารถจัดการคุกกี้ได้ที่การตั้งค่าเบราว์เซอร์',
    ],
    en: [
      'We use cookies to:',
      '• Maintain login state (essential)',
      '• Prevent CSRF attacks (essential)',
      '• Remember your language preference (preference)',
      '• Analyze usage (analytics — requires consent)',
      'You can manage cookies via your browser settings.',
    ],
  },
  {
    title: { th: '9. ความปลอดภัยของข้อมูล', en: '9. Data Security' },
    th: [
      '• เข้ารหัสข้อมูลระหว่างส่ง (TLS 1.3)',
      '• เข้ารหัสรหัสผ่านด้วย bcrypt',
      '• ระบบตรวจจับและบล็อกการล็อกอินที่ผิดปกติ',
      '• การเข้าถึงฐานข้อมูลจำกัดเฉพาะพนักงานที่ได้รับอนุญาต',
      '• การสำรองข้อมูลรายวันพร้อมเข้ารหัส',
    ],
    en: [
      '• Data encrypted in transit (TLS 1.3)',
      '• Passwords hashed with bcrypt',
      '• Automated detection and blocking of suspicious logins',
      '• Database access limited to authorized personnel',
      '• Daily encrypted backups',
    ],
  },
  {
    title: { th: '10. ข้อมูลเด็ก', en: '10. Children\'s Data' },
    th: [
      'บริการของเราไม่ได้ออกแบบสำหรับผู้เยาว์อายุต่ำกว่า 20 ปีที่ไม่มีผู้ปกครองดูแล',
      'หากท่านเป็นผู้เยาว์ กรุณาให้ผู้ปกครองจองแทน',
      'หากพบว่ามีการเก็บข้อมูลเด็กโดยไม่ได้รับความยินยอม เราจะลบข้อมูลทันที',
    ],
    en: [
      'Our service is not intended for minors under 20 without parental supervision.',
      'Minors should have a parent or guardian make bookings on their behalf.',
      'If we discover data collected from a child without consent, we will delete it immediately.',
    ],
  },
  {
    title: { th: '11. การเปลี่ยนแปลงนโยบาย', en: '11. Changes to This Policy' },
    th: [
      'เราอาจปรับปรุงนโยบายนี้เป็นระยะ',
      'การเปลี่ยนแปลงสำคัญจะแจ้งให้ทราบผ่านอีเมลหรือประกาศบนเว็บไซต์',
      'วันที่ปรับปรุงล่าสุดจะอยู่ด้านบนของหน้านี้',
    ],
    en: [
      'We may update this policy periodically.',
      'Significant changes will be notified via email or on-site banner.',
      'The "Last updated" date at the top of this page reflects the latest revision.',
    ],
  },
  {
    title: { th: '12. การร้องเรียน', en: '12. Complaints' },
    th: [
      'หากท่านเห็นว่าเราประมวลผลข้อมูลไม่ถูกต้อง ท่านสามารถร้องเรียนต่อ:',
      'สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)',
      'https://www.pdpc.or.th',
    ],
    en: [
      'If you believe we have processed your data incorrectly, you may file a complaint with:',
      'Personal Data Protection Committee (PDPC)',
      'https://www.pdpc.or.th',
    ],
  },
  {
    title: { th: '13. การจัดการความยินยอม', en: '13. Consent Management' },
    th: [
      'เมื่อท่านเข้าใช้งานเว็บไซต์ครั้งแรก เราจะแสดงแบนเนอร์ขอความยินยอมเรื่องคุกกี้ที่ไม่จำเป็น (เช่น คุกกี้วิเคราะห์)',
      'ท่านสามารถยอมรับ ปฏิเสธ หรือเลือกเฉพาะบางประเภทได้ และเปลี่ยนแปลงการตั้งค่าได้ในภายหลังผ่านลิงก์ "การตั้งค่าคุกกี้" ด้านล่างของทุกหน้า',
      'การเพิกถอนความยินยอมจะไม่กระทบต่อความถูกต้องของการประมวลผลที่ดำเนินการก่อนหน้า',
    ],
    en: [
      'On your first visit, we display a consent banner for non-essential cookies (e.g., analytics).',
      'You may accept, decline, or selectively enable categories, and adjust your choices later via the "Cookie Settings" link in the site footer.',
      'Withdrawing consent does not affect the lawfulness of processing carried out beforehand.',
    ],
  },
  {
    title: { th: '14. การแจ้งเหตุละเมิดข้อมูล', en: '14. Data Breach Notification' },
    th: [
      'หากเกิดเหตุการณ์ที่ข้อมูลส่วนบุคคลของท่านถูกละเมิดและมีความเสี่ยงสูง เราจะแจ้งสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.) ภายใน 72 ชั่วโมงนับแต่ทราบเหตุ',
      'หากเหตุการณ์นั้นมีความเสี่ยงต่อสิทธิและเสรีภาพของท่านในระดับสูง เราจะแจ้งท่านโดยตรงผ่านอีเมลโดยเร็วที่สุด พร้อมระบุลักษณะเหตุการณ์ ข้อมูลที่ได้รับผลกระทบ และมาตรการที่เราดำเนินการ',
    ],
    en: [
      'In the event of a personal data breach posing a risk to your rights, we will notify the Personal Data Protection Committee (PDPC) within 72 hours of becoming aware of the incident.',
      'If the breach is likely to result in a high risk to your rights and freedoms, we will notify you directly by email without undue delay, describing the nature of the breach, the data affected, and the steps we are taking.',
    ],
  },
  {
    title: { th: '15. การตัดสินใจอัตโนมัติและการวิเคราะห์ข้อมูล', en: '15. Automated Decisions and Profiling' },
    th: [
      'เราไม่ใช้การตัดสินใจอัตโนมัติเพียงอย่างเดียวที่ส่งผลทางกฎหมายหรือกระทบท่านอย่างมีนัยสำคัญ',
      'ระบบป้องกันการฉ้อโกงและการคัดกรองรีวิวอาจใช้กฎเกณฑ์อัตโนมัติช่วยกรองเบื้องต้น แต่การตัดสินใจขั้นสุดท้ายมีเจ้าหน้าที่ทบทวนเสมอ',
      'ท่านสามารถขอให้ทบทวนการตัดสินใจที่เกี่ยวข้องด้วยมนุษย์ได้ที่ privacy@gotjourneythailand.com',
    ],
    en: [
      'We do not use solely automated decision-making that produces legal effects or similarly significant impacts on you.',
      'Fraud-prevention and review-moderation systems may apply automated rules for initial screening, but final decisions are always reviewed by a human operator.',
      'You may request human review of any relevant decision by writing to privacy@gotjourneythailand.com.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-900 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={16} />
          กลับสู่หน้าหลัก / Back to home
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Shield className="text-emerald-600" size={24} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              นโยบายความเป็นส่วนตัว / Privacy Policy
            </h1>
          </div>

          <p className="text-sm text-slate-500 mb-10">
            ปรับปรุงล่าสุด / Last updated: {LAST_UPDATED_TH} · {LAST_UPDATED_EN}
          </p>

          <div className="space-y-10">
            {sections.map((s, idx) => (
              <section key={idx}>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3">
                  {s.title.th} / {s.title.en}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {s.th.map((p, i) => (
                      <p key={`th-${i}`}>{p}</p>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm text-slate-600 leading-relaxed italic whitespace-pre-line">
                    {s.en.map((p, i) => (
                      <p key={`en-${i}`}>{p}</p>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-1">
            <p>
              ดูเพิ่มเติม:{' '}
              <Link href="/terms" className="text-slate-900 hover:underline">
                ข้อกำหนดและเงื่อนไข (Terms of Service)
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
