import Link from "next/link";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";

const EFFECTIVE_DATE = "2026년 7월 9일";

export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AppHeader backHref="/settings" backLabel="" />

      <div className="flex-1 overflow-y-auto px-6 pb-10 pt-4">
        <h1 className="text-center text-[18px] font-semibold text-black">
          서비스 약관 및 방침
        </h1>
        <p className="mt-2 text-center text-[12px] text-[#929292]">
          시행일: {EFFECTIVE_DATE}
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-[15px] font-bold text-black">서비스 이용약관</h2>
          <TermsBlock title="제1조 (목적)">
            본 약관은 구구레터(이하 &quot;서비스&quot;)가 제공하는 쪽지 작성·전달
            서비스의 이용 조건 및 절차, 이용자와 운영자의 권리·의무를 규정함을
            목적으로 합니다.
          </TermsBlock>
          <TermsBlock title="제2조 (서비스 내용)">
            서비스는 카카오 계정을 통한 로그인 후, 이용자가 쪽지를 작성·전달하고
            상대방의 홈 링크를 통해 쪽지를 주고받을 수 있는 기능을 제공합니다.
          </TermsBlock>
          <TermsBlock title="제3조 (이용자의 의무)">
            이용자는 타인의 권리를 침해하거나 불법·음란·혐오·광고성 내용을
            전송해서는 안 됩니다. 신고된 쪽지는 운영 정책에 따라 숨김 처리될 수
            있습니다.
          </TermsBlock>
          <TermsBlock title="제4조 (서비스 변경 및 중단)">
            운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수
            있으며, 중요한 변경 시 서비스 내 공지합니다.
          </TermsBlock>
          <TermsBlock title="제5조 (계정 탈퇴)">
            이용자는 설정 화면에서 언제든지 탈퇴할 수 있습니다. 탈퇴 시 계정
            정보는 삭제되며, 이미 전달된 쪽지는 서비스 정책에 따라 보관·표시될
            수 있습니다.
          </TermsBlock>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-[15px] font-bold text-black">
            개인정보 처리방침
          </h2>
          <TermsBlock title="1. 수집 항목">
            카카오 로그인을 통해 제공받는 식별 정보(이메일 등), 서비스 이용 중
            생성되는 닉네임·상태메시지·쪽지 내용·이용 기록이 수집됩니다.
          </TermsBlock>
          <TermsBlock title="2. 이용 목적">
            회원 식별, 쪽지 전달, 서비스 운영·개선, 부정 이용 방지 및 고객
            문의 대응에 이용합니다.
          </TermsBlock>
          <TermsBlock title="3. 보관 및 파기">
            회원 탈퇴 시 지체 없이 파기합니다. 다만 관련 법령에 따라 일정 기간
            보관이 필요한 경우 해당 기간 동안 보관할 수 있습니다.
          </TermsBlock>
          <TermsBlock title="4. 제3자 제공">
            서비스 제공을 위해 Supabase(인증·DB), 카카오(로그인) 등 필수
            위탁·처리 업체에 최소한의 정보가 전달될 수 있습니다.
          </TermsBlock>
          <TermsBlock title="5. 문의">
            개인정보 관련 문의는{" "}
            <Link
              href="mailto:guguletter@gmail.com"
              className="underline underline-offset-2"
            >
              guguletter@gmail.com
            </Link>
            으로 연락해 주세요.
          </TermsBlock>
        </section>
      </div>
    </main>
  );
}

function TermsBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-[#474747]">{title}</h3>
      <p className="mt-1 text-[13px] leading-[1.6] text-[#787878]">
        {children}
      </p>
    </div>
  );
}
