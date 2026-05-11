/**
 * Terms of Service (Bilingual TH/EN)
 *
 * Why this page matters:
 *   - Stripe will not activate a live account without a ToS URL.
 *   - Business registration in Thailand requires clear booking
 *     terms including cancellation/refund policy.
 *   - Gives staff + customers a single source of truth when a
 *     dispute arises.
 *
 * Content pattern: section-by-section with both languages
 * side-by-side on desktop and stacked on mobile. No i18n hooks
 * needed — the legal copy must never "silently change" on
 * language switch, so render both verbatim.
 */

import Link from 'next/link'
import { ArrowLeft, ScrollText } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | Got Journey Thailand',
  description:
    'ข้อกำหนดและเงื่อนไขการใช้งาน Got Journey Thailand — Terms of Service for bookings, cancellations, refunds, and user conduct.',
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
    title: { th: '1. การยอมรับข้อกำหนด', en: '1. Acceptance of Terms' },
    th: [
      'การใช้งานเว็บไซต์ Got Journey Thailand (ต่อไปนี้เรียกว่า "เว็บไซต์" หรือ "บริการ") ถือว่าท่านได้อ่าน เข้าใจ และยอมรับข้อกำหนดเหล่านี้แล้ว',
      'หากท่านไม่ยอมรับข้อกำหนดใด ๆ กรุณาหยุดใช้งานบริการทันที',
    ],
    en: [
      'By accessing or using the Got Journey Thailand website (the "Service"), you agree to be bound by these Terms of Service.',
      'If you do not agree with any part of the terms, you must not use the Service.',
    ],
  },
  {
    title: { th: '2. ลักษณะการให้บริการ', en: '2. Nature of the Service' },
    th: [
      'Got Journey Thailand เป็นตัวกลางในการเชื่อมต่อระหว่างลูกค้ากับผู้ให้บริการที่พัก และผู้ให้บริการรถเช่าในจังหวัดเชียงราย',
      'เราไม่ได้เป็นเจ้าของที่พักหรือรถเช่าโดยตรง การให้บริการจริงเป็นความรับผิดชอบของพาร์ทเนอร์แต่ละราย',
    ],
    en: [
      'Got Journey Thailand operates as an intermediary platform connecting customers with accommodation and car rental partners in Chiang Rai.',
      'We do not directly own the properties or vehicles listed. Actual service delivery is the responsibility of each partner.',
    ],
  },
  {
    title: { th: '3. การจองและการชำระเงิน', en: '3. Bookings and Payments' },
    th: [
      'การจองจะสมบูรณ์ก็ต่อเมื่อชำระเงินสำเร็จและได้รับรหัสการจองยืนยัน',
      'ราคาที่แสดงรวมภาษีมูลค่าเพิ่มแล้ว เว้นแต่จะระบุไว้เป็นอย่างอื่น',
      'การชำระเงินดำเนินการผ่าน Stripe ซึ่งเป็นผู้ให้บริการชำระเงินที่ได้รับการรับรอง PCI-DSS Level 1',
      'เราไม่จัดเก็บข้อมูลบัตรเครดิตบนระบบของเรา',
    ],
    en: [
      'A booking is confirmed only upon successful payment and issuance of a booking confirmation code.',
      'Prices displayed include VAT unless otherwise stated.',
      'Payment processing is handled by Stripe, a PCI-DSS Level 1 certified payment provider.',
      'We do not store credit card information on our servers.',
    ],
  },
  {
    title: { th: '4. นโยบายการยกเลิกและคืนเงิน', en: '4. Cancellation and Refund Policy' },
    th: [
      'ลูกค้าสามารถยกเลิกการจองได้ตามเงื่อนไขต่อไปนี้:',
      '• ยกเลิกก่อนวันเช็คอิน 7 วันขึ้นไป — คืนเงินเต็มจำนวน (100%)',
      '• ยกเลิกก่อนวันเช็คอิน 3-6 วัน — คืนเงิน 50%',
      '• ยกเลิกน้อยกว่า 3 วันก่อนวันเช็คอิน — ไม่คืนเงิน',
      'การคืนเงินจะดำเนินการผ่านช่องทางเดียวกับที่ชำระเข้ามา ภายใน 5-14 วันทำการ ขึ้นอยู่กับผู้ออกบัตร',
    ],
    en: [
      'Customers may cancel bookings under the following terms:',
      '• 7+ days before check-in — 100% refund',
      '• 3-6 days before check-in — 50% refund',
      '• Less than 3 days before check-in — no refund',
      'Refunds are processed back to the original payment method within 5-14 business days, depending on your card issuer.',
    ],
  },
  {
    title: { th: '5. ความรับผิดชอบของผู้ใช้', en: '5. User Responsibilities' },
    th: [
      'ผู้ใช้ต้องให้ข้อมูลที่เป็นจริงและถูกต้องในการจอง',
      'ผู้ใช้ต้องปฏิบัติตามกฎของโรงแรมหรือผู้ให้บริการรถเช่าแต่ละแห่ง',
      'ห้ามใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย',
      'ผู้ใช้ต้องแสดงบัตรประชาชนหรือหนังสือเดินทางเมื่อเช็คอินหรือรับรถ',
    ],
    en: [
      'Users must provide accurate and truthful information when making bookings.',
      'Users must comply with the rules of each accommodation or car rental partner.',
      'The Service must not be used for any illegal purposes.',
      'Users must present valid ID or passport when checking in or picking up a vehicle.',
    ],
  },
  {
    title: { th: '6. ข้อจำกัดความรับผิดชอบ', en: '6. Limitation of Liability' },
    th: [
      'Got Journey Thailand ไม่รับผิดชอบต่อความเสียหายทางอ้อม ความเสียหายที่เป็นผลต่อเนื่อง หรือการสูญเสียรายได้',
      'ความรับผิดสูงสุดของเราจำกัดอยู่ที่จำนวนเงินที่ท่านชำระสำหรับการจองนั้น ๆ',
      'เราไม่รับผิดชอบต่อคุณภาพการให้บริการของพาร์ทเนอร์ ซึ่งเป็นความรับผิดชอบโดยตรงของพาร์ทเนอร์นั้น ๆ',
    ],
    en: [
      'Got Journey Thailand shall not be liable for indirect, consequential, or loss-of-profits damages.',
      'Our maximum liability is limited to the amount paid for the specific booking in question.',
      'We are not liable for the quality of service provided by partners, which is the direct responsibility of each partner.',
    ],
  },
  {
    title: { th: '7. ทรัพย์สินทางปัญญา', en: '7. Intellectual Property' },
    th: [
      'เนื้อหา โลโก้ เครื่องหมายการค้า และการออกแบบทั้งหมดบนเว็บไซต์เป็นกรรมสิทธิ์ของ Got Journey Thailand หรือผู้อนุญาต',
      'ห้ามทำซ้ำ เผยแพร่ หรือใช้งานในเชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร',
    ],
    en: [
      'All content, logos, trademarks, and designs on the website are the property of Got Journey Thailand or its licensors.',
      'Reproduction, redistribution, or commercial use without written permission is prohibited.',
    ],
  },
  {
    title: { th: '8. การรีวิวและเนื้อหาจากผู้ใช้', en: '8. User Reviews and Content' },
    th: [
      'ผู้ใช้สามารถส่งรีวิวได้หลังจากเข้าพักหรือใช้บริการจริง',
      'รีวิวทุกรายการจะผ่านการตรวจสอบก่อนเผยแพร่',
      'รีวิวที่มีเนื้อหาหมิ่นประมาท หยาบคาย หรือเป็นการโฆษณาจะไม่ถูกเผยแพร่',
      'เมื่อส่งรีวิว ผู้ใช้อนุญาตให้ Got Journey Thailand นำเนื้อหาไปใช้ในการประชาสัมพันธ์ได้',
    ],
    en: [
      'Users may submit reviews after actual stays or service use.',
      'All reviews are moderated before being published.',
      'Defamatory, offensive, or promotional reviews will not be published.',
      'By submitting a review, users grant Got Journey Thailand the right to use the content for promotional purposes.',
    ],
  },
  {
    title: { th: '9. การเปลี่ยนแปลงข้อกำหนด', en: '9. Changes to the Terms' },
    th: [
      'เราขอสงวนสิทธิ์ในการปรับปรุงข้อกำหนดเหล่านี้ได้ตลอดเวลา',
      'การเปลี่ยนแปลงจะมีผลเมื่อโพสต์บนหน้านี้พร้อมวันที่ปรับปรุงใหม่',
      'การใช้งานบริการต่อหลังการเปลี่ยนแปลง ถือว่าท่านยอมรับข้อกำหนดฉบับใหม่',
    ],
    en: [
      'We reserve the right to update these Terms at any time.',
      'Changes take effect when posted on this page with a new "Last updated" date.',
      'Continued use of the Service after changes constitutes acceptance of the new Terms.',
    ],
  },
  {
    title: { th: '10. กฎหมายที่ใช้บังคับ', en: '10. Governing Law' },
    th: [
      'ข้อกำหนดเหล่านี้อยู่ภายใต้กฎหมายของราชอาณาจักรไทย',
      'ข้อพิพาทใด ๆ ให้เสนอต่อศาลที่มีเขตอำนาจในจังหวัดเชียงราย หรือกรุงเทพมหานคร',
    ],
    en: [
      'These Terms are governed by the laws of the Kingdom of Thailand.',
      'Any disputes shall be submitted to courts with jurisdiction in Chiang Rai Province or Bangkok.',
    ],
  },
  {
    title: { th: '11. ข้อห้ามและการใช้งานที่ไม่เหมาะสม', en: '11. Prohibited Conduct' },
    th: [
      'นอกเหนือจากข้อ 5 ผู้ใช้ตกลงจะไม่กระทำการดังต่อไปนี้:',
      '• ทำ web scraping, crawling หรือดึงข้อมูลด้วยระบบอัตโนมัติโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร',
      '• ใช้บัตรเครดิตที่ได้มาโดยทุจริต หรือทำธุรกรรมที่เข้าข่ายฉ้อโกง / ฟอกเงิน',
      '• คุกคาม ข่มขู่ หรือใช้ถ้อยคำหยาบคายต่อพนักงาน พาร์ทเนอร์ หรือผู้ใช้รายอื่น',
      '• สร้างบัญชีปลอม หรือใช้ข้อมูลของผู้อื่นโดยไม่ได้รับความยินยอม',
      '• พยายามเจาะระบบ ทดสอบช่องโหว่ หรือรบกวนการให้บริการ',
      'การฝ่าฝืนอาจส่งผลให้บัญชีถูกระงับและถูกดำเนินคดีตามกฎหมาย',
    ],
    en: [
      'In addition to Section 5, users agree NOT to:',
      '• Perform web scraping, crawling, or automated data extraction without prior written permission',
      '• Use fraudulently obtained payment cards or engage in transactions amounting to fraud or money laundering',
      '• Harass, threaten, or use abusive language toward staff, partners, or other users',
      '• Create fake accounts or use another person’s information without their consent',
      '• Attempt to penetrate, probe, or disrupt the Service',
      'Violations may result in account suspension and legal action.',
    ],
  },
  {
    title: { th: '12. การระงับและยุติบัญชี', en: '12. Account Suspension and Termination' },
    th: [
      'เราขอสงวนสิทธิ์ในการระงับหรือยุติบัญชีของท่านได้ทันที หากตรวจพบการละเมิดข้อกำหนดเหล่านี้ การฉ้อโกง หรือการกระทำที่อาจก่อให้เกิดความเสียหายต่อผู้ใช้รายอื่นและพาร์ทเนอร์',
      'การยุติบัญชีไม่กระทบต่อสิทธิเรียกร้องค่าเสียหายที่เกิดขึ้นก่อนหน้านั้น',
      'ท่านสามารถปิดบัญชีของตนเองได้ตลอดเวลาผ่านการตั้งค่าบัญชี หรือโดยการติดต่อทีมงาน',
    ],
    en: [
      'We reserve the right to suspend or terminate your account immediately upon detection of any breach of these Terms, fraud, or conduct likely to cause harm to other users and partners.',
      'Termination does not affect any claim for damages that arose before termination.',
      'You may close your own account at any time through account settings or by contacting our team.',
    ],
  },
  {
    title: { th: '13. เหตุสุดวิสัย', en: '13. Force Majeure' },
    th: [
      'เราไม่ต้องรับผิดต่อความล่าช้าหรือการไม่สามารถปฏิบัติตามข้อตกลงได้ อันเนื่องมาจากเหตุที่อยู่เหนือการควบคุมตามสมควร เช่น ภัยธรรมชาติ การระบาดของโรค สงคราม การจลาจล คำสั่งของรัฐ ระบบโครงสร้างพื้นฐานล่ม หรือการโจมตีทางไซเบอร์',
      'ในกรณีดังกล่าว เราจะแจ้งให้ท่านทราบโดยเร็ว และดำเนินการตามสมควรเพื่อคืนเงินหรือเลื่อนการจอง',
    ],
    en: [
      'We are not liable for delay or failure to perform caused by events beyond our reasonable control, including natural disasters, pandemics, war, civil unrest, government orders, infrastructure outages, or cyberattacks.',
      'In such cases, we will notify you promptly and take reasonable steps to refund or reschedule bookings.',
    ],
  },
  {
    title: { th: '14. การระงับข้อพิพาท', en: '14. Dispute Resolution' },
    th: [
      'หากเกิดข้อพิพาท ทั้งสองฝ่ายตกลงที่จะเจรจาโดยสุจริตก่อน โดยติดต่อทีมงานที่ hello@gotjourneythailand.com',
      'หากไม่สามารถยุติได้ภายใน 30 วัน คู่กรณีอาจเสนอข้อพิพาทเข้าสู่กระบวนการไกล่เกลี่ยของหน่วยงานคุ้มครองผู้บริโภคที่เกี่ยวข้อง',
      'หากการไกล่เกลี่ยไม่สำเร็จ ให้นำคดีขึ้นสู่ศาลที่มีเขตอำนาจตามข้อ 10',
    ],
    en: [
      'In the event of a dispute, both parties agree to first attempt good-faith negotiation by contacting hello@gotjourneythailand.com.',
      'If unresolved within 30 days, either party may submit the dispute to mediation through the relevant consumer-protection authority.',
      'If mediation fails, the dispute shall be brought before the courts with jurisdiction under Section 10.',
    ],
  },
  {
    title: { th: '15. การแยกข้อกำหนด', en: '15. Severability' },
    th: [
      'หากข้อกำหนดส่วนใดส่วนหนึ่งของข้อตกลงนี้ตกเป็นโมฆะหรือไม่สามารถบังคับใช้ได้ตามกฎหมาย ส่วนที่เหลือยังคงมีผลใช้บังคับได้อย่างสมบูรณ์',
      'ข้อกำหนดที่เป็นโมฆะจะถูกตีความให้ใกล้เคียงเจตนาเดิมที่สุดเท่าที่กฎหมายอนุญาต',
    ],
    en: [
      'If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.',
      'The invalid provision shall be interpreted to most closely reflect its original intent within the limits permitted by law.',
    ],
  },
  {
    title: { th: '16. การติดต่อ', en: '16. Contact' },
    th: [
      'หากมีข้อสงสัยเกี่ยวกับข้อกำหนดเหล่านี้ กรุณาติดต่อที่:',
      'อีเมล: hello@gotjourneythailand.com',
      'โทรศัพท์: +66 2 123 4567',
    ],
    en: [
      'For questions about these Terms, please contact:',
      'Email: hello@gotjourneythailand.com',
      'Phone: +66 2 123 4567',
    ],
  },
]

export default function TermsPage() {
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
            <div className="p-2 bg-slate-100 rounded-xl">
              <ScrollText className="text-slate-900" size={24} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              ข้อกำหนดและเงื่อนไข / Terms of Service
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
                  <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
                    {s.th.map((p, i) => (
                      <p key={`th-${i}`}>{p}</p>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm text-slate-600 leading-relaxed italic">
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
              <Link href="/privacy" className="text-slate-900 hover:underline">
                นโยบายความเป็นส่วนตัว (Privacy Policy)
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
