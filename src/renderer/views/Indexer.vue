<template>
  <div class="indexer_container">
    <div class="object_container">

    </div>
    <div class="code_area">
      <div class="code_container">
        <PrismEditor :lineNumbers="true" :code="code" language="sql"></PrismEditor>
      </div>
    </div>
    <div class="indexes_container">

    </div>
  </div>
</template>

<script>
  import { ipcRenderer } from 'electron'
  import Prism from 'prismjs'
  import PrismEditor from 'vue-prism-editor'
  import 'prismjs/themes/prism.css'
  import 'vue-prism-editor/dist/VuePrismEditor.css'

  export default {
    name: 'indexer',
    components: {
      Prism,
      PrismEditor
    },
    data () {
      return {
        objectList: [],
        code: '',
        indexList: [],
        themes: []
      }
    },
    methods: {
      fnGetConnectionInfo () {
        ipcRenderer.on('get_connection', (event, connection) => {
          if (connection) {
            this.host = connection.host
            this.serviceName = connection.serviceName
            this.user = connection.user
            this.password = connection.password
            this.rememberConnection = connection.rememberConnection
          }
        })

        ipcRenderer.send('get_connection')
      },
      fnGetThemes () {
        ipcRenderer.on('get_themes', (event, themes) => {
          this.themes = themes
          console.log(themes)
        })

        ipcRenderer.send('get_themes')
      }
    },
    mounted () {
      this._keyListener = (e) => {
        if (e.key === 'F4') {
          require('../assets/css/themes/grayscale.css')
        }
      }
      document.addEventListener('keydown', this._keyListener.bind(this))

      this.fnGetConnectionInfo()
      this.fnGetThemes()
      const sqlString = `
FUNCTION        SF_DC_MAIN
( P_CI_NO                   IN     VARCHAR2,      -- 체크인번호(신규변경 2015.08.05 지역코드>>체크인번호)
  P_MEM_NO                  IN     VARCHAR2,      -- 회원번호(우대번호) 
  P_CI_YMD                  IN     VARCHAR2,      -- 체크인일자
  P_RSV_BLCK_CD             IN     VARCHAR2,      -- 예약블럭코드(타입쉐어때문에 추가됨.)
  P_STORE_CD                IN     VARCHAR2,      -- 영업장코드
  P_PROJECT_GUBUN           IN     VARCHAR2,      -- 프로젝트구분 (에약'', 객실'10') 
  P_DONG_CD                 IN     VARCHAR2,      -- 동코드 추가 090922 
  P_PYEONG_CD               IN     VARCHAR2,      -- 객실코드(예약평형) 
  P_RM_KIND_CD              IN     VARCHAR2,      -- 객실타입
  P_RM_VIEW_TYPE            IN     VARCHAR2,      -- 객실코드(구분없음,비전망 10 전망 20) 
  P_RM_LOCKER_NO            IN     VARCHAR2,      -- 객실번호(지정객실회원)2009.3.16 추가
  P_USER_IND_CD             IN     VARCHAR2,      -- 본인여부(사용자구분>> E:지인, J:지명, N:회원초청, Y:본인, Z:없음) 
  P_RESERVED_GUBUN          IN     VARCHAR2,      -- 예약구분(1:예약, 2:내장, P:현장변경) 
  P_CUPON_NO                IN     VARCHAR2,      -- 무료쿠폰번호
  P_KEY_RSV_NO              IN     VARCHAR2,      -- 예약번호 
  P_JOB                     IN     VARCHAR2,      -- 작업구분(0: 기준단가(판촉연회용), 1 : 정상, 2 : TEMP 삭제, 9:자료전환) 
  P_EXPT_YN                 IN     VARCHAR2,      -- 규정외 유무 (1 : 규정외, 0 : 정상) 
  P_EXPT_AMT                IN     VARCHAR2,      -- 규정외 금액 (0 : 정상) 
  P_AMT_BASE                IN     VARCHAR2,      -- 요금분할기준(콘도) 
  P_NATION_CD               IN     VARCHAR2     DEFAULT 'KR',     -- 국가코드(콘도) 
  P_ZERO_TAX_RATE_YN        IN     VARCHAR2,      -- 영세율여부(콘도) 
  P_SVC_RATE                IN     VARCHAR2,      -- 봉사료율(콘도) 
  P_VAT_RATE                IN     VARCHAR2,      -- 부가세율(콘도) 
  P_TAX_RATE                IN     VARCHAR2,      -- 기금율(콘도) 
  P_RSV_IND_CD              IN     VARCHAR2,      -- 예약구분(1:직원휴가, 8:법인옵션, 9:회원...)
  P_NIGHTS                  IN     NUMBER,        -- 숙박수 추가....
  P_RSV_MEM_IND             IN     VARCHAR2     DEFAULT 'M',        -- 예약회원구분(M:회원,G:일반,F:FIT)
  P_RM_TYPE_CD              IN     VARCHAR2     DEFAULT NULL,       -- 객실유형코드
  P_MENU_CD                 IN     VARCHAR2     DEFAULT NULL,       -- 객실우대요금코드     (M:일경우 신규일경우 NULL, 수정일경우 메뉴코드를 가지고 간다.
  P_RM_CNT                  IN     VARCHAR2     DEFAULT '1',        -- 객실수
  P_ADULT_CNT               IN     NUMBER       DEFAULT 1,          -- 대인수 추가....
  P_CHILD_CNT               IN     NUMBER       DEFAULT 0,          -- 소인수 추가....
  P_DAIL_RM_AMT_REQS_YN     IN     VARCHAR2     DEFAULT '0',        -- 일별객실료요청여부(1:적용,0:미적용)
  P_OVER_AMT_REQS_YN        IN     VARCHAR2     DEFAULT '0',        -- 초과요금요청여부(콘도회원이 사용일수를 초과시 대여요금적용)
  P_SPECL_BNFT_REQS_YN      IN     VARCHAR2     DEFAULT '1',        -- 특별혜택요청여부(특별혜택적용을 원할겨우)
  P_PRT_RM_SEQ              IN     VARCHAR2     DEFAULT NULL,       -- 판촉객실순번
  P_ETC_02                  IN     VARCHAR2     DEFAULT NULL,       -- 기타 02(라이프웨이 적용여부)
  P_ETC_03                  IN     VARCHAR2     DEFAULT NULL,       -- 기타 03
  P_ETC_04                  IN     VARCHAR2     DEFAULT NULL,       -- 기타 04
  P_ETC_05                  IN     VARCHAR2     DEFAULT NULL,       -- 기타 05
  P_MSG_LANG_TYPE           IN     VARCHAR2     DEFAULT 'KOR'       -- 오류MSG언어유형
) 
RETURN TABLE_DC_MAIN  
PIPELINED
IS
/******************************************************************************

   NAME:       SF_DC_MAIN(AS-IS : PR_DC_MAIN, PR_DC_MAIN_TS)
   PURPOSE:    회원별 우대적용 평션

   REVISIONS:
   Ver        Date        Author           Description
   ---------  ----------  ---------------  ------------------------------------
   1.0        2014.11.03      HSK       최초작성
   1.1        2014.12.17      HSK       수정보완
******************************************************************************/
/* 
   요금테이블를 숙박수에..따라..LOOP돌린후..
   TYPE으로 변환시켜...
   테이블 함수로..사용가능하게 함..
   사용타입.. : TYPE_DC_MAIN, TABLE_DC_MAIN
   사용예제.. 
   아래 와 같이... 기존 SP_DC_MAIN의 IN 패러미터에 박수만 추가하여..사용하면 되요..
   SELECT *
FROM
TABLE(CAST(SF_DC_MAIN (  '01'--AJIYUK_CODE 
                                          ,'72267400'--AMEMBER_NO       
                                          , '20141201'--AGIJUN_DATE        
                                          , '02'--AUPJANG_CODE
                                          , ''--APROJECT_GUBUN    
                                          , '00'--ADONG_CODE        
                                          , 'A' --APYUNG_CODE        
                                          , '00'-- AROOM_KIND_CODE   
                                          , '10' --AROOM_TYPE         
                                          , ''--AROOM_NO         
                                          , 'Y'--ABONIN_YN         
                                          , ''--ARESERVED_GUBUN   
                                          , ''--ACUPON_NO         
                                          , ''-- AUPJANG_SEQ       
                                          , ''--AJOB             
                                          , 'Y'--AEXPT_YN       
                                         , '0' --AEXPT_AMT       
                                          ,'20'--AAMT_BASE         
                                          , 'KO'--ANATION_CODE      
                                          , 'Y'--ANF_BASE          
                                          , '0'--ASERVICE_RATE    
                                          ,'10'--AVAT_RATE         
                                          ,'0' --ATAX_RATE       
                                          ,'9'--AMEMBER_ADD_NO
                                          ,3--V_NIGHTS--박
                                      ) AS TABLE_DC_MAIN 
                       )
                ) 
                
  SELECT *
    FROM
    TABLE(CAST(SF_DC_MAIN (  '19'--AJIYUK_CODE 
                                          ,'87141450'--AMEMBER_NO       
                                          , '20141201'--AGIJUN_DATE        
                                          , '29'--AUPJANG_CODE
                                          , ''--APROJECT_GUBUN    
                                          , '00'--ADONG_CODE        
                                          , 'A' --APYUNG_CODE        
                                          , '20'-- AROOM_KIND_CODE   
                                          , '10' --AROOM_TYPE         
                                          , ''--AROOM_NO         
                                          , 'Y'--ABONIN_YN         
                                          , ''--ARESERVED_GUBUN   
                                          , ''--ACUPON_NO         
                                          , ''-- AUPJANG_SEQ       
                                          , ''--AJOB             
                                          , 'Y'--AEXPT_YN       
                                         , '0' --AEXPT_AMT       
                                          ,'20'--AAMT_BASE         
                                          , 'KO'--ANATION_CODE      
                                          , 'Y'--ANF_BASE          
                                          , '0'--ASERVICE_RATE    
                                          ,'10'--AVAT_RATE         
                                          ,'0' --ATAX_RATE       
                                          ,'9'--AMEMBER_ADD_NO
                                          , 3--V_NIGHTS--박
                                          ,'F'
                                          ,'00A20'
                                          ,'ZA'
                                          ,10
                                      ) AS TABLE_DC_MAIN 
                       )
                ) 
   
*/
--SELECT CI_YMD -- 체크인일자 
--,CI_YMD AS OPRT_YMD -- 체크인일자 
--,TO_CHAR(TO_DATE(CI_YMD, 'YYYYMMDD'), 'DY') AS WD /* 작업요일 */ 
--,RESULT_MEM_NO -- 실적우대번호 
--,NET_AMT -- 공급가액 
--,SVC_AMT -- 봉사료 
--,VAT_AMT -- 부가세액 
--,TAX_AMT -- 기금액 
--,RM_AMT -- 적용금액(투숙사용-전망,비전망 구분에 따른요금) 
--,VIEW_AMT -- 전망금액 
--,NON_VIEW_AMT -- 비전망금액 
--,TOT_AMT -- 총금액 
--,BASE_AMT AS INIT_RM_AMT -- 적용금액의 기본요금(M0요금) (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경) 
--,PKG_ADD_AMT -- 패키지추가금액 
--,DC_IND_CD -- 할인구분 
--,DC_RATE -- 할인율 
--,DC_AMT -- 할인금액 
--,LONG_DC_RATE -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%) 
--,LONG_DC_RATE_NM -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%) 
--,MENU_CD -- GUEST_TYPE_ITEM2 (M0,M3,M5,..) 
--,MENU_NM -- GUEST_TYPE_ITEM2 (M0,M3,M5,..) 
--,MEM_IND -- 고객구분(member_code) 
--,MEM_NM -- 회원명 
--,FAMILY_NM -- 가족명 
--,PVL_IND_CD -- 우대구분 
--,PVL_IND_NM -- 우대구분명 
--,PVL_BGN_YMD -- 우대적용시작일자 
--,PVL_END_YMD -- 우대종료일자 
--,JUMIN_NO -- 주민등록번호/사업자등록번호 
--,SALE_YN -- 발권(판매)가능여부 ( 사용안함?사업장도? ) 
--,USE_TOT_CNT -- 사용일수(남은일수) 
--,GUEST_KIND -- 고객유형(C0009) 
--,GUEST_KIND_NM -- 고객유형명(C0009) 
--,SEASON_CD -- 시즌코드 
--,SEASON_NM -- 시즌코드명 
--,CALC_IND_CD -- 정산구분(C0011-현지직불,후불,선납) 
--,CALC_IND_NM -- 정산구분(C0011-현지직불,후불,선납) 
--,MSG -- 비고 
--,ERR_CD -- 에러코드 
--,RATE_SEARCH_ALL -- 요금조회시 모든조건 20100224 
--,MEMBER_KIND -- 회원분류 101202 
--,SPECL_BNFT_GUEST_YN -- 특별혜택적용여부 101202 
--,TEMP_1 -- 장기가입우대서비스 정상요금 
--,TEMP_2 -- 장기가입우대서비스 할인요금 
--,TEMP_3 -- 예비용1 
--,MARKET_CD -- 마켓코드 
--,MARKET_NM -- 마켓명 
--,RESULT -- TO-BE 에러처리코드 
--FROM TABLE(SF_DC_MAIN ( '02', '86100249', '20150306', '02','' , '00', 'A', '20', '10','' , 'Y', '', '', '', '', '0', '0', '20', '', '0', '0', '10', '0', '9', 1, 'G', '00A20', NULL, '1'))
--          

V_LOOP                    NUMBER;
V_LIFE_YN                 VARCHAR2(1);
V_CI_YMD                  VARCHAR2(10);             --숙박일
V_MENU_CD                 RSV_RM_RSV.MENU_CD%TYPE;  --메뉴코드
V_RSV_MENU_CD             RSV_RM_RSV.MENU_CD%TYPE;  --메뉴코드
O_RESULT_MEM_NO           VARCHAR2(20);      -- 실적우대번호
O_TOT_NET_AMT             VARCHAR2(20);      -- 공급가액
O_TOT_SVC_AMT             VARCHAR2(20);      -- 봉사료
O_TOT_VAT_AMT             VARCHAR2(20);      -- 부가세액
O_TOT_TAX_AMT             VARCHAR2(20);      -- 기금액
O_NET_AMT                 VARCHAR2(20);      -- 공급가액
O_SVC_AMT                 VARCHAR2(20);      -- 봉사료
O_VAT_AMT                 VARCHAR2(20);      -- 부가세액
O_TAX_AMT                 VARCHAR2(20);      -- 기금액
O_RM_ADD_AMT              VARCHAR2(20);      -- 추가금액    
O_RM_AMT                  VARCHAR2(20);      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)
O_VIEW_AMT                VARCHAR2(20);      -- 전망금액
O_NON_VIEW_AMT            VARCHAR2(20);      -- 비전망금액
O_TOT_AMT                 VARCHAR2(20);      -- 총금액
O_BASE_AMT                VARCHAR2(20);      -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)    
O_ORG_RM_AMT              VARCHAR2(20);      -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)
O_PKG_ADD_AMT             VARCHAR2(20);      -- 패키지추가금액
O_DC_IND_CD               VARCHAR2(20) := '2';      -- 할인구분    
O_DC_RATE                 VARCHAR2(20) := '0';      -- 할인율
O_DC_AMT                  VARCHAR2(20) := '0';      -- 할인금액 
O_LONG_DC_RATE            VARCHAR2(20);      -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%)  
O_MENU_CD                 VARCHAR2(20);      -- GUEST_TYPE_ITEM2 (M0;M3;M5;..)   
O_MENU_NM                 VARCHAR2(100);     -- GUEST_TYPE_ITEM2 (M0;M3;M5;..)   
O_MEM_IND                 VARCHAR2(20);      -- 고객구분(member_code) 
O_MEM_NM                  VARCHAR2(100);     -- 회원명
O_FAMILY_NM               VARCHAR2(100);     -- 가족명
O_PVL_IND_CD              VARCHAR2(20);      -- 우대구분
O_PVL_IND_NM              VARCHAR2(100);     -- 우대구분명
O_PVL_BGN_YMD             VARCHAR2(20);      -- 우대적용시작일자
O_PVL_END_YMD             VARCHAR2(20);      -- 우대종료일자
O_JUMIN_NO                VARCHAR2(80);      -- 주민등록번호/사업자등록번호
O_SALE_YN                 VARCHAR2(20);      -- 발권(판매)가능여부 (      사용안함?사업장도?       )  
O_USE_TOT_CNT             VARCHAR2(20);      -- 사용일수(남은일수) 
O_GUEST_KIND              VARCHAR2(20);      -- 고객유형(C0009) 
O_GUEST_KIND_NM           VARCHAR2(100);     -- 고객유형명(C0009) 
O_SEASON_CD               VARCHAR2(20);      -- 시즌코드
O_SEASON_NM               VARCHAR2(100);     -- 시즌코드명
O_CALC_IND_CD             VARCHAR2(20);      -- 정산구분(C0011-현지직불;후불;선납) 
O_MSG                     VARCHAR2(4000);    -- 비고
O_ERR_CD                  VARCHAR2(20);      -- 에러코드
O_RATE_SEARCH_ALL         VARCHAR2(4000);    -- 요금조회시 모든조건  20100224 
O_MEMBER_KIND             VARCHAR2(20);      -- 회원분류 101202 
O_SPECL_BNFT_GUEST_YN     VARCHAR2(20);      -- 특별혜택적용여부 101202 
O_LONG_SBSCRB_DC_AMT                  VARCHAR2(20);      -- 장기가입우대서비스 정상요금  
O_TEMP_2                  VARCHAR2(20);      -- 장기가입우대서비스 할인요금 
O_TEMP_3                  VARCHAR2(20);      -- 예비용1         
O_LONG_DC_RATE_NM         VARCHAR2(100); 
O_CALC_IND_NM             VARCHAR2(100);
O_MARKET_CD               VARCHAR2(10);
O_MARKET_NM               VARCHAR2(100);
O_ETC_01                  VARCHAR2(100);     -- 기타01
O_ETC_02                  VARCHAR2(100);     -- 기타02
O_ETC_03                  VARCHAR2(100);     -- 기타03
O_ETC_04                  VARCHAR2(100);     -- 기타04
O_ETC_05                  VARCHAR2(100);     -- 기타05
O_RESULT                  VARCHAR2(10);
V_APPLY_BGN_YMD           VARCHAR2(10);
V_APPLY_END_YMD           VARCHAR2(10);

V_DEFAULT_RATE_CD         VARCHAR2(10);      -- 기준RATE코드

V_SVC_RATE                NUMBER(18,3);
V_VAT_RATE                NUMBER(18,3);

V_INIT_ADULT_CNT          NUMBER(18,3)  := 0;
V_INIT_CHILD_CNT          NUMBER(18,3)  := 0;

V_OVER_ADULT_CNT          NUMBER(18,3)  := 0;
V_OVER_CHILD_CNT          NUMBER(18,3)  := 0;

V_INIT_ADULT_AMT          NUMBER(18,3)  := 0;
V_INIT_CHILD_AMT          NUMBER(18,3)  := 0;

V_OVER_ADULT_AMT          NUMBER(18,3)  := 0;
V_OVER_CHILD_AMT          NUMBER(18,3)  := 0;

V_TOT_PKG_ADD_AMT         NUMBER(18,3)  := 0;

V_PRT_STND_ERR_CD         VARCHAR2(18);             -- 단체 기준(입실)일자 에러코드
V_PRT_STND_RM_AMT         NUMBER(18,3)  := 0;       -- 단체 기준(입실)일자 객실요금

V_RESULT_MEM_NO           MEM_UNITY_MEM.MAIN_MEM_NO%TYPE;       -- 회원번호
V_MEM_IND                 MEM_UNITY_MEM.MEM_IND%TYPE;           -- 회원구분
V_RETIRE_YMD              MEM_UNITY_MEM.EMPL_RETIRE_YMD%TYPE;   -- 직원퇴사일자

V_RM_AMT_CD_IND           VARCHAR2(10)  := 'M';                     

V_EXPT_YN                 VARCHAR2(1)   := '0';
V_ORG_EXPT_YN             VARCHAR2(1)   := '0';
V_EXPT_AMT                VARCHAR2(20)  := '0';
V_ORG_EXPT_AMT            NUMBER(18,3)  := 0;

V_SQL                     VARCHAR2(20000);

V_GNRL_RSV_YN             VARCHAR2(1) := '0';
V_RM_AMT_CHG_YN           VARCHAR2(1) := '0';
V_NIGHTS                  NUMBER(18) := 0;                                  
BEGIN

    V_NIGHTS := TO_NUMBER(P_NIGHTS);
    IF P_PROJECT_GUBUN = '10' AND V_NIGHTS = 0 THEN
        V_NIGHTS := 1;
    END IF;
    

    V_EXPT_YN   := NVL(P_EXPT_YN,'0');
    V_EXPT_AMT  := NVL(P_EXPT_AMT,'0');
    -- 라이프웨이 적용여부
    IF NVL(P_ETC_02, ' ')  = '1' THEN
        BEGIN
             SELECT SF_GETRSVMEMRSVPSBLYN(P_MEM_NO) AS YN
               INTO V_LIFE_YN
               FROM DUAL;
        EXCEPTION
             WHEN OTHERS THEN
                V_LIFE_YN := 'N';
        END;
    ELSE
        V_LIFE_YN := 'N';
    END IF;
    
    
    SELECT NVL(SVC_RATE, 0)
         , NVL(VAT_RATE, 0)
      INTO V_SVC_RATE
         , V_VAT_RATE
      FROM SSL_STORE_MNGM 
     WHERE STORE_CD = P_STORE_CD
    ;

    V_LOOP          := 0;
    V_CI_YMD        := P_CI_YMD;
    V_MENU_CD       := P_MENU_CD;
    V_RSV_MENU_CD   := '';
    O_MENU_CD       := V_MENU_CD;
    
    IF TRIM(P_CI_NO) IS NOT NULL THEN
        --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','3 P_CI_NO >>'||P_CI_NO);
        BEGIN
            SELECT MENU_CD, MENU_CD, NVL(EXPT_YN,'0'), RM_AMT
              INTO O_MENU_CD, V_RSV_MENU_CD, V_ORG_EXPT_YN, V_ORG_EXPT_AMT
              FROM RSL_CI_MST_DAMO
             WHERE CI_NO = P_CI_NO
            ;
            IF P_MENU_CD <> O_MENU_CD THEN
                O_MENU_CD := P_MENU_CD;
                V_RM_AMT_CHG_YN := '1';
            END IF;
        EXCEPTION
        WHEN OTHERS THEN
            V_ORG_EXPT_AMT := 0;
            V_MENU_CD   := P_MENU_CD;
        END;
    ELSIF TRIM(P_KEY_RSV_NO) IS NOT NULL THEN
        --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','4 P_KEY_RSV_NO >>'||P_KEY_RSV_NO);
        
        BEGIN
            
            SELECT MENU_CD, MENU_CD, NVL(EXPT_YN,'0'), RM_AMT
              INTO O_MENU_CD, V_RSV_MENU_CD, V_ORG_EXPT_YN, V_ORG_EXPT_AMT
              FROM RSV_RM_RSV
             WHERE KEY_RSV_NO = P_KEY_RSV_NO
            ;
            IF P_MEM_NO LIKE '861%' AND O_MENU_CD <> P_MENU_CD THEN 
                O_MENU_CD := P_MENU_CD;
            ELSIF P_MENU_CD <> O_MENU_CD THEN
                O_MENU_CD := P_MENU_CD;
                V_RM_AMT_CHG_YN := '1';
            END IF;            
            --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','4-2 O_MENU_CD >>'||O_MENU_CD);
        EXCEPTION
        WHEN OTHERS THEN
            V_ORG_EXPT_AMT := 0;
            V_MENU_CD   := P_MENU_CD;
        END; 
    ELSE
        V_ORG_EXPT_AMT := 0;
    END IF;
            
    
--    PKG_RSVLOGRM.SP_INSERT('SF_DC_MAIN','P_MEM_NO : '|| P_MEM_NO||' P_KEY_RSV_NO : '|| P_KEY_RSV_NO ||' V_MENU_CD : '|| V_MENU_CD  ,'TEST','TEST','TEST','Y');
    
    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','시작');    
    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','V_MENU_CD=' || V_MENU_CD);
    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','P_DAIL_RM_AMT_REQS_YN=' || P_DAIL_RM_AMT_REQS_YN);
    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','P_RSV_MEM_IND=' || P_RSV_MEM_IND);
    
    IF P_RSV_MEM_IND = 'M' THEN
        BEGIN
            SELECT MENU_CD
              INTO V_MENU_CD
              FROM RSV_RM_AMT_CD
             WHERE STORE_CD = P_STORE_CD
               AND MENU_CD = V_MENU_CD
               AND MENU_KIND_CD <> 'F'
            ;
        EXCEPTION 
        WHEN OTHERS THEN
            V_MENU_CD := '';
        END;
        
        FOR  V_LOOP IN  1..V_NIGHTS   LOOP
                       
            O_TOT_NET_AMT             := '0';      -- 공급가액
            O_TOT_SVC_AMT             := '0';      -- 봉사료
            O_TOT_VAT_AMT             := '0';      -- 부가세액
            O_TOT_TAX_AMT             := '0';      -- 기금액
            O_RM_AMT                  := '0';      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)    
            O_VIEW_AMT                := '0';      -- 전망금액
            O_NON_VIEW_AMT            := '0';      -- 비전망금액
            O_TOT_AMT                 := '0';      -- 총금액
            O_BASE_AMT                := '0';      -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)
            O_ORG_RM_AMT              := '0';      -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)
            O_PKG_ADD_AMT             := '0';      -- 패키지추가금액
            O_DC_IND_CD               := '0';      -- 할인구분    
            O_DC_RATE                 := '0';      -- 할인율
            O_DC_AMT                  := '0';      -- 할인금액
            V_INIT_ADULT_CNT          := 1;        -- 패키지기준인원수(FIT외에는 1로 한다)
            V_INIT_CHILD_CNT          := 1;        -- 패키지기준인원수(FIT외에는 1로 한다)
            V_TOT_PKG_ADD_AMT         := 0;

            IF TRIM(P_CI_NO) IS NOT NULL THEN
                --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','3 P_CI_NO >>'||P_CI_NO);

                    IF NVL(P_EXPT_YN,'0') = V_ORG_EXPT_YN AND NVL(P_EXPT_YN,'0') = '1' AND V_ORG_EXPT_AMT = TO_NUMBER(NVL(P_EXPT_AMT,'0')) THEN
                        BEGIN
                            SELECT TO_CHAR(NVL(RM_AMT,0))
                              INTO V_EXPT_AMT
                              FROM RSL_DAIL_RM_AMT
                             WHERE CI_NO    = P_CI_NO
                               AND OPRT_YMD = V_CI_YMD
                            ;
                        EXCEPTION
                        WHEN OTHERS THEN
                            NULL;
                        END;
                    END IF;
                        

            ELSIF TRIM(P_KEY_RSV_NO) IS NOT NULL THEN
                --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','4 P_KEY_RSV_NO >>'||P_KEY_RSV_NO);
  
                    IF NVL(P_EXPT_YN,'0') = V_ORG_EXPT_YN AND NVL(P_EXPT_YN,'0') = '1' AND V_ORG_EXPT_AMT = TO_NUMBER(NVL(P_EXPT_AMT,'0')) THEN
                        BEGIN
                            SELECT TO_CHAR(NVL(RM_AMT,0))
                              INTO V_EXPT_AMT
                              FROM RSV_DAIL_RM_AMT
                             WHERE KEY_RSV_NO   = P_KEY_RSV_NO
                               AND OPRT_YMD     = V_CI_YMD
                            ;
                        EXCEPTION
                        WHEN OTHERS THEN
                            NULL;
                        END;
                    END IF;
                        
            ELSE
                --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','5 V_MENU_CD >>'||V_MENU_CD);
                NULL;
            END IF;
            
--            PKG_RSVLOGRM.SP_INSERT('SF_DC_MAINZ','P_MEM_NO : '|| P_MEM_NO||' P_KEY_RSV_NO : '|| P_KEY_RSV_NO ||' V_MENU_CD : '|| V_MENU_CD  ,'TEST','TEST','TEST','Y');
                
            SP_DC_MAIN(
                      P_CI_YMD                  ,      -- 체크인일자
                      P_MEM_NO                  ,      -- 회원번호(우대번호) 
                      V_CI_YMD                  ,      -- 기준일자
                      P_RSV_BLCK_CD             ,      -- 예약블럭코드(타입쉐어때문에 추가됨.)
                      P_STORE_CD                ,      -- 영업장코드
                      P_PROJECT_GUBUN           ,      -- 프로젝트구분 (에약'', 객실'10') 
                      P_DONG_CD                 ,      -- 동코드 추가 090922 
                      P_PYEONG_CD               ,      -- 객실코드(예약평형) 
                      P_RM_KIND_CD              ,      -- 객실타입
                      P_RM_VIEW_TYPE            ,      -- 객실코드(구분없음,비전망 10 전망 20) 
                      P_RM_LOCKER_NO            ,      -- 객실번호(지정객실회원)2009.3.16 추가
                      P_USER_IND_CD             ,      -- 본인여부(사용자구분>> E:지인, J:지명, N:회원초청, Y:본인, Z:없음) 
                      P_RESERVED_GUBUN          ,      -- 예약구분(1:예약, 2:내장, P:현장변경) 
                      P_CUPON_NO                ,      -- 무료쿠폰번호
                      P_KEY_RSV_NO              ,      -- 예약번호
                      P_CI_NO                   ,      -- 체크인번호
                      P_JOB                     ,      -- 작업구분(1 : 정상, 2 : TEMP 삭제) 
                      V_EXPT_YN                 ,      -- 규정외 유무 (Y : 규정외, N : 정상) 
                      V_EXPT_AMT                ,      -- 규정외 금액 (0 : 정상) 
                      P_AMT_BASE                ,      -- 요금분할기준(콘도) 
                      P_NATION_CD               ,      -- 국가코드(콘도) 
                      NVL(P_ZERO_TAX_RATE_YN,'0')        ,      -- 영세율적용유무(콘도) 
                      P_SVC_RATE                ,      -- 봉사료율(콘도) 
                      P_VAT_RATE                ,      -- 부가세율(콘도) 
                      P_TAX_RATE                ,      -- 기금율(콘도) 
                      P_RSV_IND_CD              ,      -- 예약구분(1:직원휴가, 8:법인옵션, 9:회원...) 
                      V_MENU_CD                 ,      -- 객실우대요금코드 
                      V_NIGHTS                  ,      -- 박수 
                      P_RM_CNT                  ,      -- 객실수
                      P_OVER_AMT_REQS_YN       ,      -- 초과요금요청여부(콘도회원이 사용일수를 초과시 대여요금적용)
                      P_SPECL_BNFT_REQS_YN     ,      -- 특별혜택요청여부(특별혜택적용을 원할겨우)
                      P_PRT_RM_SEQ                  ,      -- 기타 01
                      P_ETC_02                  ,      -- 기타 02
                      P_ETC_03                  ,      -- 기타 03
                      P_ETC_04                  ,      -- 기타 04
                      P_ETC_05                  ,      -- 기타 05
                      O_RESULT_MEM_NO           ,      -- 실적우대번호
                      O_NET_AMT                 ,      -- 공급가액
                      O_SVC_AMT                 ,      -- 봉사료
                      O_VAT_AMT                 ,      -- 부가세액
                      O_TAX_AMT                 ,      -- 기금액
                      O_RM_AMT                  ,      -- 적용금액(투숙사용-전망,비전망 구분에 따른요금)    
                      O_VIEW_AMT                ,      -- 전망금액
                      O_NON_VIEW_AMT            ,      -- 비전망금액
                      O_PKG_ADD_AMT             ,      -- 패키지추가금액
                      O_BASE_AMT                ,      -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)
                      O_ORG_RM_AMT              ,      -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)    
                      O_LONG_DC_RATE            ,      -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%)  
                      O_MENU_CD                 ,      -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                      O_MENU_NM                 ,      -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                      O_MEM_IND                 ,      -- 고객구분(member_code) 
                      O_MEM_NM                  ,      -- 회원명
                      O_FAMILY_NM               ,      -- 가족명
                      O_PVL_IND_CD              ,      -- 우대구분
                      O_PVL_IND_NM              ,      -- 우대구분명
                      O_PVL_BGN_YMD             ,      -- 우대적용시작일자
                      O_PVL_END_YMD             ,      -- 우대종료일자
                      O_JUMIN_NO                ,      -- 주민등록번호/사업자등록번호
                      O_SALE_YN                 ,      -- 발권(판매)가능여부 (      사용안함?사업장도?       )  
                      O_USE_TOT_CNT             ,      -- 사용일수(남은일수) 
                      O_GUEST_KIND              ,      -- 고객유형(C0009) 
                      O_GUEST_KIND_NM           ,      -- 고객유형명(C0009) 
                      O_SEASON_CD               ,      -- 시즌코드
                      O_SEASON_NM               ,      -- 시즌코드명
                      O_CALC_IND_CD             ,      -- 정산구분(C0011-현지직불,후불,선납) 
                      O_MSG                     ,      -- 비고
                      O_ERR_CD                  ,      -- 에러코드
                      O_RATE_SEARCH_ALL         ,      -- 요금조회시 모든조건  20100224 
                      O_MEMBER_KIND             ,      -- 회원분류 101202 
                      O_SPECL_BNFT_GUEST_YN     ,      -- 특별혜택적용여부 101202 
                      O_LONG_SBSCRB_DC_AMT      ,      -- 장기가입우대서비스 정상요금  
                      O_MARKET_CD               ,      -- 마켓코드
                      O_MARKET_NM               ,      -- 마켓명
                      O_ETC_01                  ,      -- 기타01
                      O_ETC_02                  ,      -- 기타02
                      O_ETC_03                  ,      -- 기타03
                      O_ETC_04                  ,      -- 기타04
                      O_ETC_05                  ,      -- 기타05
                      O_RESULT                         -- TO-BE 에러처리코드
                     );
                     /*
         DBMS_OUTPUT.PUT_LINE('SP_DC_MAIN start             ');                     
        DBMS_OUTPUT.PUT_LINE('P_CI_YMD             =' ||  P_CI_YMD           );
        DBMS_OUTPUT.PUT_LINE('P_MEM_NO             =' ||  P_MEM_NO           );
        DBMS_OUTPUT.PUT_LINE('P_STORE_CD      =' ||  P_STORE_CD           );
        DBMS_OUTPUT.PUT_LINE('P_DONG_CD         =' ||  P_DONG_CD              );
        DBMS_OUTPUT.PUT_LINE('P_PYEONG_CD             =' ||  P_PYEONG_CD                  );
        DBMS_OUTPUT.PUT_LINE('P_RSV_BLCK_CD        =' ||  P_RSV_BLCK_CD             );
        DBMS_OUTPUT.PUT_LINE('O_RM_AMT        =' ||  O_RM_AMT             );
                             
         DBMS_OUTPUT.PUT_LINE('SP_DC_MAIN end             ');
         */
                     
                IF TRIM(O_MENU_CD) IS NULL AND P_MEM_NO LIKE '87%' THEN
                    O_MENU_CD := NVL(O_MENU_CD,'ZA');
                ELSE
                    O_MENU_CD := NVL(O_MENU_CD,'ZZ');
                END IF;
                
                --PKG_RSVLOGRM.SP_INSERT('SF_DC_MAINZ','P_MEM_NO : '|| P_MEM_NO||' P_KEY_RSV_NO : '|| P_KEY_RSV_NO ||' O_MENU_CD : '|| O_MENU_CD  ,'TEST','TEST','TEST','Y');
                
                --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','O_MENU_CD :='||O_MENU_CD,'TEST','TEST','TEST','Y');
                

                    SELECT
                          MENU_NM                       /* 메뉴코드(SSL_UNITY_MENU) */
                         ,MARKET_CD                     /* 마켓코드(RSV_MARKET_CD) */
                         ,SF_GETRSVMARKETCDNM(MARKET_CD) MARKET_NM                     /* 마켓코드(RSV_MARKET_CD) */
                     INTO O_MENU_NM
                         ,O_MARKET_CD
                         ,O_MARKET_NM
                    FROM RSV_RM_AMT_CD
                   WHERE STORE_CD = P_STORE_CD
                     AND MENU_CD  = O_MENU_CD
                   ;
                     
            SELECT SF_GETSYSCOMMCDNM('RSV0048', O_LONG_DC_RATE) 
              INTO O_LONG_DC_RATE_NM
              FROM DUAL; 
                               
            SELECT SF_GETSYSCOMMCDNM('RSL0114', O_CALC_IND_CD)
              INTO O_CALC_IND_NM
              FROM DUAL;
               
              
--            IF O_MEM_IND <> '41' THEN
               O_PKG_ADD_AMT := '0';
               BEGIN
                   FOR I IN (SELECT PKG_NO
                                   ,NVL(ADULT_CNT_IF_YN,'0') AS ADULT_CNT_IF_YN 
                                   ,NVL(CHILD_CNT_IF_YN,'0') AS CHILD_CNT_IF_YN
                                   ,NIGHTS_IF_YN
                                   ,DECODE(NVL(NIGHTS_IF_YN,'0'), '0', DECODE(P_CI_YMD, V_CI_YMD, SF_PKG_BREAKFAST_AMT(PKG_NO, V_CI_YMD), 0), SF_PKG_BREAKFAST_AMT(PKG_NO, V_CI_YMD)) AS PKG_ADD_AMT
                               FROM RSV_RM_AMT_PKG
                              WHERE STORE_CD = P_STORE_CD
                                AND MENU_CD  = O_MENU_CD
                            )
                   LOOP
                       
                       -- 대인수연동
                       IF I.ADULT_CNT_IF_YN = '1' THEN
                           IF TO_NUMBER(NVL(P_ADULT_CNT,0)) > 0 THEN
                               IF TO_NUMBER(P_ADULT_CNT) > 0 THEN
                                   O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT * TO_NUMBER(P_ADULT_CNT);
                               ELSE
                                   O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;  
                               END IF;
                           END IF;
                       -- 소인수 연동
                       ELSIF I.CHILD_CNT_IF_YN = '1' THEN
                           IF TO_NUMBER(NVL(P_CHILD_CNT,0)) > 0 THEN
                               IF TO_NUMBER(P_CHILD_CNT) > 0 THEN
                                   O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT * TO_NUMBER(P_CHILD_CNT);
                               ELSE
                                   O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;
                               END IF;
                           END IF;
                       ELSE
                           O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;
                       END IF;

                           
                   END LOOP;
               EXCEPTION
               WHEN NO_DATA_FOUND THEN
                   O_ERR_CD := '9999';
                   O_MSG := '요금이 설정되지 않았습니다.';
               END;
--            END IF;
            
            V_TOT_PKG_ADD_AMT := O_PKG_ADD_AMT;
--            
--            FOR I IN (SELECT PKG_NO
--                            ,NVL(ADULT_CNT_IF_YN,'0') AS ADULT_CNT_IF_YN 
--                            ,NVL(CHILD_CNT_IF_YN,'0') AS CHILD_CNT_IF_YN
--                            ,NIGHTS_IF_YN
--                        FROM RSV_RM_AMT_PKG
--                       WHERE STORE_CD = P_STORE_CD
--                         AND MENU_CD  = O_MENU_CD
--                     )
--            LOOP
--            
--                IF I.NIGHTS_IF_YN = '1' THEN
--                    -- 대인수연동
--                    IF I.ADULT_CNT_IF_YN = '1' THEN
--                        IF TO_NUMBER(NVL(P_ADULT_CNT,0)) > 0 THEN
--                            IF V_INIT_ADULT_CNT < P_ADULT_CNT THEN
--                                V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT + O_PKG_ADD_AMT * (P_ADULT_CNT - V_INIT_ADULT_CNT);
--                            ELSE
--                                V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                            END IF;
--                        END IF;
--                    -- 소인수 연동
--                    ELSIF I.CHILD_CNT_IF_YN = '1' THEN
--                        IF TO_NUMBER(NVL(P_CHILD_CNT,0)) > 0 THEN
--                            IF V_INIT_CHILD_CNT < P_CHILD_CNT THEN
--                                V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT + O_PKG_ADD_AMT * (P_CHILD_CNT - V_INIT_CHILD_CNT);
--                            ELSE
--                                V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                            END IF;
--                        END IF;
--                    ELSE
--                        V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                    END IF;
--                ELSIF I.NIGHTS_IF_YN = '0' AND P_CI_YMD = V_CI_YMD THEN
--                    --V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                    -- 대인수연동
--                    IF I.ADULT_CNT_IF_YN = '1' THEN
--                        IF TO_NUMBER(NVL(P_ADULT_CNT,0)) > 0 THEN
--                            IF V_INIT_ADULT_CNT < P_ADULT_CNT THEN
--                                V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT + O_PKG_ADD_AMT * (P_ADULT_CNT - V_INIT_ADULT_CNT);
--                            ELSE
--                                V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                            END IF;
--                        END IF;
--                    -- 소인수 연동
--                    ELSIF I.CHILD_CNT_IF_YN = '1' THEN
--                        IF TO_NUMBER(NVL(P_CHILD_CNT,0)) > 0 THEN
--                            IF V_INIT_CHILD_CNT < P_CHILD_CNT THEN
--                                V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT + O_PKG_ADD_AMT * (P_CHILD_CNT - V_INIT_CHILD_CNT);
--                            ELSE
--                                V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                            END IF;
--                        END IF;
--                    ELSE
--                        V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                    END IF;
--                END IF;
--                        
--            END LOOP;
            
--             O_TOT_NET_AMT := SF_NET_AMT_CALC((TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
--             O_TOT_SVC_AMT := SF_SERVICE_AMT_CALC((TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
--             O_TOT_VAT_AMT := SF_VAT_AMT_CALC((TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
--             O_TOT_AMT := (TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1'));

            O_TOT_NET_AMT := SF_NET_AMT_CALC(TO_NUMBER(NVL(V_TOT_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
            O_TOT_SVC_AMT := SF_SERVICE_AMT_CALC(TO_NUMBER(NVL(V_TOT_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
            O_TOT_VAT_AMT := SF_VAT_AMT_CALC(TO_NUMBER(NVL(V_TOT_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);

            O_TOT_NET_AMT := (O_TOT_NET_AMT + O_NET_AMT)*TO_NUMBER(NVL(P_RM_CNT,'1'));
            O_TOT_SVC_AMT := (O_TOT_SVC_AMT + O_SVC_AMT)*TO_NUMBER(NVL(P_RM_CNT,'1'));
            O_TOT_VAT_AMT := (O_TOT_VAT_AMT + O_VAT_AMT)*TO_NUMBER(NVL(P_RM_CNT,'1'));
                          
            O_TOT_AMT := O_TOT_NET_AMT + O_TOT_SVC_AMT + O_TOT_VAT_AMT;


--            IF V_LIFE_YN = 'Y' THEN
--                O_TOT_NET_AMT             := '0';      -- 공급가액
--                O_TOT_SVC_AMT             := '0';      -- 봉사료
--                O_TOT_VAT_AMT             := '0';      -- 부가세액
--                O_TOT_TAX_AMT             := '0';      -- 기금액
--                O_RM_AMT                  := '0';      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)    
--                O_VIEW_AMT                := '0';      -- 전망금액
--                O_NON_VIEW_AMT            := '0';      -- 비전망금액
--                O_TOT_AMT                 := '0';      -- 총금액
--                O_BASE_AMT                := '0';      -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)
--                O_ORG_RM_AMT              := '0';      -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)    
--                O_PKG_ADD_AMT             := '0';      -- 패키지추가금액
--                O_DC_IND_CD               := '0';      -- 할인구분    
--                O_DC_RATE                 := '0';      -- 할인율
--                O_DC_AMT                  := '0';      -- 할인금액
--            END IF;


            O_DC_AMT        := TO_NUMBER(O_BASE_AMT)-TO_NUMBER(NVL(O_RM_AMT,'0'));
                    
            SELECT SUBSTR(DECODE(O_BASE_AMT, NULL, 0, 0, 0, TRUNC(TO_NUMBER(NVL(O_DC_AMT,'0')) / TO_NUMBER(O_BASE_AMT) * 100, 2)),1,6)
              INTO O_DC_RATE
              FROM DUAL;
                                
            PIPE ROW (TYPE_DC_MAIN (V_CI_YMD             ,    -- 체크인일자
                                P_RM_CNT                  ,    -- 객실수
                                O_RESULT_MEM_NO           ,    -- 실적우대번호
                                O_TOT_NET_AMT             ,    -- 공급가액
                                O_TOT_SVC_AMT             ,    -- 봉사료
                                O_TOT_VAT_AMT             ,    -- 부가세액
                                O_TOT_TAX_AMT             ,    -- 기금액
                                NVL(O_RM_ADD_AMT,0)       ,    -- 추가금액    
                                NVL(O_RM_AMT,0)           ,    -- 적용금액(투숙사용-전망,비전망 구분에 따른요금)    
                                NVL(O_VIEW_AMT,0)         ,    -- 전망금액
                                NVL(O_NON_VIEW_AMT,0)     ,    -- 비전망금액
                                NVL(O_TOT_AMT,0)          ,    -- 총금액
                                NVL(O_BASE_AMT,0)         ,    -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)
                                NVL(O_ORG_RM_AMT,0)       ,    -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)
                                NVL(V_TOT_PKG_ADD_AMT,0)  ,    -- 패키지추가금액
                                O_DC_IND_CD               ,    -- 할인구분    
                                O_DC_RATE                 ,    -- 할인율
                                NVL(O_DC_AMT,0)           ,    -- 할인금액    
                                O_LONG_DC_RATE            ,    -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%)  
                                O_LONG_DC_RATE_NM         ,    -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%)  
                                O_MENU_CD                 ,    -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                                O_MENU_NM                 ,    -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                                O_MEM_IND                 ,    -- 고객구분(member_code) 
                                O_MEM_NM                  ,    -- 회원명
                                O_FAMILY_NM               ,    -- 가족명
                                O_PVL_IND_CD              ,    -- 우대구분
                                O_PVL_IND_NM              ,    -- 우대구분명
                                O_PVL_BGN_YMD             ,    -- 우대적용시작일자
                                O_PVL_END_YMD             ,    -- 우대종료일자
                                SUBSTR(O_JUMIN_NO,1,2)    ,    -- 주민등록번호/사업자등록번호
                                O_SALE_YN                 ,    -- 발권(판매)가능여부 (      사용안함?사업장도?       )  
                                O_USE_TOT_CNT             ,    -- 사용일수(남은일수) 
                                O_GUEST_KIND              ,    -- 고객유형(C0009) 
                                O_GUEST_KIND_NM           ,    -- 고객유형명(C0009) 
                                O_SEASON_CD               ,    -- 시즌코드
                                O_SEASON_NM               ,    -- 시즌코드명
                                O_CALC_IND_CD             ,    -- 정산구분(C0011-현지직불,후불,선납) 
                                O_CALC_IND_NM             ,    -- 정산구분(C0011-현지직불,후불,선납) 
                                O_MSG                     ,    -- 비고
                                O_ERR_CD                  ,    -- 에러코드
                                O_RATE_SEARCH_ALL         ,    -- 요금조회시 모든조건  20100224 
                                O_MEMBER_KIND             ,    -- 회원분류 101202 
                                O_SPECL_BNFT_GUEST_YN     ,    -- 특별혜택적용여부 101202 
                                O_LONG_SBSCRB_DC_AMT      ,    -- 장기가입우대서비스 정상요금  
                                O_MARKET_CD               ,
                                O_MARKET_NM               ,
                                V_INIT_ADULT_CNT          ,
                                V_INIT_CHILD_CNT          ,
                                O_ETC_01                  ,
                                O_ETC_02                  ,
                                O_ETC_03                  ,
                                O_ETC_04                  ,
                                O_ETC_05                  ,
                                O_RESULT                       -- TO-BE 에러처리코드          
                               )
                        );    
             V_CI_YMD := TO_CHAR(TO_DATE(V_CI_YMD,'YYYYMMDD') + 1,'YYYYMMDD');                                
        END LOOP;
    ELSIF P_RSV_MEM_IND = 'G' THEN
--        DBMS_OUTPUT.Put_Line('V_MENU_CD>>>'||V_MENU_CD);
--        DBMS_OUTPUT.Put_Line('P_PROJECT_GUBUN>>>'||P_PROJECT_GUBUN);
--        
--        DBMS_OUTPUT.Put_Line('P_STORE_CD>>>'||P_STORE_CD);
--        
--        DBMS_OUTPUT.Put_Line('P_JOB>>>'||NVL(TRIM(P_JOB),'ZZ'));

        IF TRIM(V_MENU_CD) IS NOT NULL THEN

            SELECT MENU_KIND_CD
              INTO V_RM_AMT_CD_IND
              FROM RSV_RM_AMT_CD
             WHERE STORE_CD = P_STORE_CD
               AND MENU_CD  = V_MENU_CD
            ;

        END IF;
       
        V_GNRL_RSV_YN := '1';
        
        IF P_MEM_NO LIKE '87%' AND TRIM(P_PRT_RM_SEQ) IS NULL THEN
        
            V_GNRL_RSV_YN := '0';
        
        END IF;
        
        --IF (TRIM(V_MENU_CD) IS NULL OR (V_MENU_CD = 'ZA' OR V_MENU_CD = 'ZZ') OR V_RM_AMT_CD_IND <> 'F') AND NVL(TRIM(P_JOB),'ZZ') != '0' AND V_GNRL_RSV_YN = '1' THEN 
        IF (TRIM(V_MENU_CD) IS NULL OR (V_MENU_CD LIKE 'ZA%' OR V_MENU_CD = 'ZZ') OR V_RM_AMT_CD_IND <> 'F') AND NVL(TRIM(P_JOB),'ZZ') != '0' AND V_GNRL_RSV_YN = '1' THEN
        
--           PKG_RSVLOGRM.SP_INSERT('SF_DC_MAIN','810 O_PVL_IND_CD '||O_PVL_IND_CD ,'TEST','TEST','TEST','Y');
        
            FOR  V_LOOP IN  1..V_NIGHTS   LOOP
                           
                O_TOT_NET_AMT             := '0';      -- 공급가액
                O_TOT_SVC_AMT             := '0';      -- 봉사료
                O_TOT_VAT_AMT             := '0';      -- 부가세액
                O_TOT_TAX_AMT             := '0';      -- 기금액
                O_RM_AMT                  := '0';      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)    
                O_VIEW_AMT                := '0';      -- 전망금액
                O_TOT_AMT                 := '0';      -- 비전망금액
                O_BASE_AMT                := '0';      -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)
                O_ORG_RM_AMT              := '0';      -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)    
                O_PKG_ADD_AMT             := '0';      -- 패키지추가금액
                O_DC_IND_CD               := '0';      -- 할인구분    
                O_DC_RATE                 := '0';      -- 할인율
                O_DC_AMT                  := '0';      -- 할인금액
                V_INIT_ADULT_CNT          := 1;        -- 패키지기준인원수(FIT외에는 1로 한다)
                V_INIT_CHILD_CNT          := 1;        -- 패키지기준인원수(FIT외에는 1로 한다)
                V_TOT_PKG_ADD_AMT         := 0;

                IF TRIM(P_CI_NO) IS NOT NULL THEN
                    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','3 P_CI_NO >>'||P_CI_NO);

                        IF NVL(P_EXPT_YN,'0') = V_ORG_EXPT_YN AND NVL(P_EXPT_YN,'0') = '1' AND V_ORG_EXPT_AMT = TO_NUMBER(NVL(P_EXPT_AMT,'0')) THEN
                            BEGIN
                                SELECT TO_CHAR(NVL(RM_AMT,0))
                                  INTO V_EXPT_AMT
                                  FROM RSL_DAIL_RM_AMT
                                 WHERE CI_NO    = P_CI_NO
                                   AND OPRT_YMD = V_CI_YMD
                                ;
                            EXCEPTION
                            WHEN OTHERS THEN
                                NULL;
                            END;
                        END IF;
                            

                ELSIF TRIM(P_KEY_RSV_NO) IS NOT NULL THEN
                    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','4 P_KEY_RSV_NO >>'||P_KEY_RSV_NO);
      
                        IF NVL(P_EXPT_YN,'0') = V_ORG_EXPT_YN AND NVL(P_EXPT_YN,'0') = '1' AND V_ORG_EXPT_AMT = TO_NUMBER(NVL(P_EXPT_AMT,'0')) THEN
                            BEGIN
                                SELECT TO_CHAR(NVL(RM_AMT,0))
                                  INTO V_EXPT_AMT
                                  FROM RSV_DAIL_RM_AMT
                                 WHERE KEY_RSV_NO   = P_KEY_RSV_NO
                                   AND OPRT_YMD     = V_CI_YMD
                                ;
                            EXCEPTION
                            WHEN OTHERS THEN
                                NULL;
                            END;
                        END IF;
                            
                ELSE
                    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','5 V_MENU_CD >>'||V_MENU_CD);
                    NULL;
                END IF;
                SP_DC_MAIN(
                          P_CI_YMD                  ,      -- 체크인일자
                          P_MEM_NO                  ,      -- 회원번호(우대번호) 
                          V_CI_YMD                  ,      -- 기준일자
                          P_RSV_BLCK_CD             ,      -- 예약블럭코드(타입쉐어때문에 추가됨.)
                          P_STORE_CD                ,      -- 영업장코드
                          P_PROJECT_GUBUN           ,      -- 프로젝트구분 (에약'', 객실'10') 
                          P_DONG_CD                 ,      -- 동코드 추가 090922 
                          P_PYEONG_CD               ,      -- 객실코드(예약평형) 
                          P_RM_KIND_CD              ,      -- 객실타입
                          P_RM_VIEW_TYPE            ,      -- 객실코드(구분없음,비전망 10 전망 20) 
                          P_RM_LOCKER_NO            ,      -- 객실번호(지정객실회원)2009.3.16 추가
                          P_USER_IND_CD             ,      -- 본인여부(사용자구분>> E:지인, J:지명, N:회원초청, Y:본인, Z:없음) 
                          P_RESERVED_GUBUN          ,      -- 예약구분(1:예약, 2:내장, P:현장변경) 
                          P_CUPON_NO                ,      -- 무료쿠폰번호
                          P_KEY_RSV_NO              ,      -- 예약번호 
                          P_CI_NO                   ,      -- 체크인번호
                          P_JOB                     ,      -- 작업구분(1 : 정상, 2 : TEMP 삭제) 
                          V_EXPT_YN                 ,      -- 규정외 유무 (Y : 규정외, N : 정상) 
                          V_EXPT_AMT                ,      -- 규정외 금액 (0 : 정상) 
                          P_AMT_BASE                ,      -- 요금분할기준(콘도) 
                          P_NATION_CD               ,      -- 국가코드(콘도) 
                          NVL(P_ZERO_TAX_RATE_YN,'0')        ,      -- 영세율적용유무(콘도) 
                          P_SVC_RATE                ,      -- 봉사료율(콘도) 
                          P_VAT_RATE                ,      -- 부가세율(콘도) 
                          P_TAX_RATE                ,      -- 기금율(콘도) 
                          P_RSV_IND_CD              ,      -- 예약구분(1:직원휴가, 8:법인옵션, 9:회원...) 
                          V_MENU_CD                 ,      -- 객실우대요금코드 
                          V_NIGHTS                  ,      -- 박수 
                          P_RM_CNT                  ,      -- 객실수
                          P_OVER_AMT_REQS_YN        ,      -- 초과요금요청여부(콘도회원이 사용일수를 초과시 대여요금적용)
                          P_SPECL_BNFT_REQS_YN      ,      -- 특별혜택요청여부(특별혜택적용을 원할겨우)
                          P_PRT_RM_SEQ              ,      -- 기타 01
                          P_ETC_02                  ,      -- 기타 02
                          P_ETC_03                  ,      -- 기타 03
                          P_ETC_04                  ,      -- 기타 04
                          P_ETC_05                  ,      -- 기타 05

                          O_RESULT_MEM_NO           ,      -- 실적우대번호
                          O_NET_AMT                 ,      -- 공급가액
                          O_SVC_AMT                 ,      -- 봉사료
                          O_VAT_AMT                 ,      -- 부가세액
                          O_TAX_AMT                 ,      -- 기금액
                          O_RM_AMT                  ,      -- 적용금액(투숙사용-전망,비전망 구분에 따른요금)    
                          O_VIEW_AMT                ,      -- 전망금액
                          O_NON_VIEW_AMT            ,      -- 비전망금액
                          O_PKG_ADD_AMT             ,      -- 패키지추가금액
                          O_BASE_AMT                ,      -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)    
                          O_ORG_RM_AMT              ,      -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)
                          O_LONG_DC_RATE            ,      -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%)  
                          O_MENU_CD                 ,      -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                          O_MENU_NM                 ,      -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                          O_MEM_IND                 ,      -- 고객구분(member_code) 
                          O_MEM_NM                  ,      -- 회원명
                          O_FAMILY_NM               ,      -- 가족명
                          O_PVL_IND_CD              ,      -- 우대구분
                          O_PVL_IND_NM              ,      -- 우대구분명
                          O_PVL_BGN_YMD             ,      -- 우대적용시작일자
                          O_PVL_END_YMD             ,      -- 우대종료일자
                          O_JUMIN_NO                ,      -- 주민등록번호/사업자등록번호
                          O_SALE_YN                 ,      -- 발권(판매)가능여부 (      사용안함?사업장도?       )  
                          O_USE_TOT_CNT             ,      -- 사용일수(남은일수) 
                          O_GUEST_KIND              ,      -- 고객유형(C0009) 
                          O_GUEST_KIND_NM           ,      -- 고객유형명(C0009) 
                          O_SEASON_CD               ,      -- 시즌코드
                          O_SEASON_NM               ,      -- 시즌코드명
                          O_CALC_IND_CD             ,      -- 정산구분(C0011-현지직불,후불,선납) 
                          O_MSG                     ,      -- 비고
                          O_ERR_CD                  ,      -- 에러코드
                          O_RATE_SEARCH_ALL         ,      -- 요금조회시 모든조건  20100224 
                          O_MEMBER_KIND             ,      -- 회원분류 101202 
                          O_SPECL_BNFT_GUEST_YN     ,      -- 특별혜택적용여부 101202 
                          O_LONG_SBSCRB_DC_AMT      ,      -- 장기가입우대서비스 정상요금  
                          O_MARKET_CD               ,      -- 마켓코드
                          O_MARKET_NM               ,      -- 마켓명
                          O_ETC_01                  ,      -- 기타01
                          O_ETC_02                  ,      -- 기타02
                          O_ETC_03                  ,      -- 기타03
                          O_ETC_04                  ,      -- 기타04
                          O_ETC_05                  ,      -- 기타05
                          O_RESULT                         -- TO-BE 에러처리코드
                         );
                
                IF TRIM(O_MENU_CD) IS NULL AND P_MEM_NO LIKE '87%' THEN
                    O_MENU_CD := NVL(O_MENU_CD,'ZA');
                ELSE
                    O_MENU_CD := NVL(O_MENU_CD,'ZZ');
                    
                END IF;
                
--                PKG_RSVLOGRM.SP_INSERT('SF_DC_MAIN','960 O_PVL_IND_CD '||O_PVL_IND_CD ,'TEST','TEST','TEST','Y');
                

                SELECT
                      MENU_NM                       /* 메뉴코드(SSL_UNITY_MENU) */
                     ,MARKET_CD                     /* 마켓코드(RSV_MARKET_CD) */
                     ,SF_GETRSVMARKETCDNM(MARKET_CD) MARKET_NM                     /* 마켓코드(RSV_MARKET_CD) */
                 INTO O_MENU_NM
                     ,O_MARKET_CD
                     ,O_MARKET_NM
                FROM RSV_RM_AMT_CD
               WHERE STORE_CD = P_STORE_CD
                 AND MENU_CD  = O_MENU_CD
               ;
               
                -- 단체 객실료 처리 방식
                IF V_EXPT_YN = '0' AND V_LOOP = 1 AND NVL(O_ERR_CD,' ') <> '1007' THEN
                    V_PRT_STND_ERR_CD := '^*^';
                    V_PRT_STND_RM_AMT := O_RM_AMT; 
                ELSIF V_EXPT_YN = '0' AND NVL(O_ERR_CD, ' ') = '1007' AND V_PRT_STND_ERR_CD = '^*^' AND V_LOOP <> 1 THEN        -- 입실일자
                    O_RM_AMT := V_PRT_STND_RM_AMT;
                    O_ERR_CD := NULL;
                END IF;
                
                --PKG_RSLLOG.SP_INSERT ('SF_DC_MAIN','끝나자 마자 O_RM_AMT:' || O_RM_AMT);
                
                SELECT SF_GETSYSCOMMCDNM('RSV0048', O_LONG_DC_RATE) 
                  INTO O_LONG_DC_RATE_NM  
                  FROM DUAL; 
                                   
                SELECT SF_GETSYSCOMMCDNM('RSL0114', O_CALC_IND_CD)
                  INTO O_CALC_IND_NM
                  FROM DUAL;
                   
                IF O_MEM_IND = '41' THEN

                   O_RM_ADD_AMT := O_PKG_ADD_AMT;

                ELSE
                   O_PKG_ADD_AMT := '0';
                   BEGIN
                       FOR I IN (SELECT PKG_NO
                                       ,NVL(ADULT_CNT_IF_YN,'0') AS ADULT_CNT_IF_YN 
                                       ,NVL(CHILD_CNT_IF_YN,'0') AS CHILD_CNT_IF_YN
                                       ,NIGHTS_IF_YN
                                       ,DECODE(NVL(NIGHTS_IF_YN,'0'), '0', DECODE(P_CI_YMD, V_CI_YMD, SF_PKG_BREAKFAST_AMT(PKG_NO, V_CI_YMD), 0), SF_PKG_BREAKFAST_AMT(PKG_NO, V_CI_YMD)) AS PKG_ADD_AMT
                                   FROM RSV_RM_AMT_PKG
                                  WHERE STORE_CD = P_STORE_CD
                                    AND MENU_CD  = O_MENU_CD
                                )
                       LOOP
                           
                           -- 대인수연동
                           IF I.ADULT_CNT_IF_YN = '1' THEN
                               IF TO_NUMBER(NVL(P_ADULT_CNT,0)) > 0 THEN
                                   IF TO_NUMBER(P_ADULT_CNT) > 0 THEN
                                       O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT * TO_NUMBER(P_ADULT_CNT);
                                   ELSE
                                       O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;  
                                   END IF;
                               END IF;
                           -- 소인수 연동
                           ELSIF I.CHILD_CNT_IF_YN = '1' THEN
                               IF TO_NUMBER(NVL(P_CHILD_CNT,0)) > 0 THEN
                                   IF TO_NUMBER(P_CHILD_CNT) > 0 THEN
                                       O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT * TO_NUMBER(P_CHILD_CNT);
                                   ELSE
                                       O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;
                                   END IF;
                               END IF;
                           ELSE
                               O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;
                           END IF;

                               
                       END LOOP;
                   EXCEPTION
                   WHEN NO_DATA_FOUND THEN
                       O_ERR_CD := '9999';
                       O_MSG := '요금이 설정되지 않았습니다.';
                   END
                   ;
                END IF;
                
                V_TOT_PKG_ADD_AMT := O_PKG_ADD_AMT;
--                FOR I IN (SELECT PKG_NO
--                                ,NVL(ADULT_CNT_IF_YN,'0') AS ADULT_CNT_IF_YN 
--                                ,NVL(CHILD_CNT_IF_YN,'0') AS CHILD_CNT_IF_YN
--                                ,NIGHTS_IF_YN
--                            FROM RSV_RM_AMT_PKG
--                           WHERE STORE_CD = P_STORE_CD
--                             AND MENU_CD  = O_MENU_CD
--                         )
--                LOOP
--                
--                    IF I.NIGHTS_IF_YN = '1' THEN
--                        -- 대인수연동
--                        IF I.ADULT_CNT_IF_YN = '1' THEN
--                            IF TO_NUMBER(NVL(P_ADULT_CNT,0)) > 0 THEN
--                                IF V_INIT_ADULT_CNT < P_ADULT_CNT THEN
--                                    V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT + O_PKG_ADD_AMT * (P_ADULT_CNT - V_INIT_ADULT_CNT);
--                                ELSE
--                                    V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                                END IF;
--                            END IF; 
--                        -- 소인수 연동
--                        ELSIF I.CHILD_CNT_IF_YN = '1' THEN
--                            IF TO_NUMBER(NVL(P_CHILD_CNT,0)) > 0 THEN
--                                IF V_INIT_CHILD_CNT < P_CHILD_CNT THEN
--                                    V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT + O_PKG_ADD_AMT * (P_CHILD_CNT - V_INIT_CHILD_CNT);
--                                ELSE
--                                    V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                                END IF;
--                            END IF;
--                        ELSE
--                            V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                        END IF;
--                    ELSIF I.NIGHTS_IF_YN = '0' AND P_CI_YMD = V_CI_YMD THEN
--                        --V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                        
--                        -- 대인수연동
--                        IF I.ADULT_CNT_IF_YN = '1' THEN
--                            IF TO_NUMBER(NVL(P_ADULT_CNT,0)) > 0 THEN
--                                IF V_INIT_ADULT_CNT < P_ADULT_CNT THEN
--                                    V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT + O_PKG_ADD_AMT * (P_ADULT_CNT - V_INIT_ADULT_CNT);
--                                ELSE
--                                    V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                                END IF;
--                            END IF; 
--                        -- 소인수 연동
--                        ELSIF I.CHILD_CNT_IF_YN = '1' THEN
--                            IF TO_NUMBER(NVL(P_CHILD_CNT,0)) > 0 THEN
--                                IF V_INIT_CHILD_CNT < P_CHILD_CNT THEN
--                                    V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT + O_PKG_ADD_AMT * (P_CHILD_CNT - V_INIT_CHILD_CNT);
--                                ELSE
--                                    V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                                END IF;
--                            END IF;
--                        ELSE
--                            V_TOT_PKG_ADD_AMT := V_TOT_PKG_ADD_AMT + O_PKG_ADD_AMT;
--                        END IF;
--                    END IF;
--                            
--                END LOOP;
                
                O_TOT_NET_AMT := SF_NET_AMT_CALC(TO_NUMBER(NVL(V_TOT_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
                O_TOT_SVC_AMT := SF_SERVICE_AMT_CALC(TO_NUMBER(NVL(V_TOT_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
                O_TOT_VAT_AMT := SF_VAT_AMT_CALC(TO_NUMBER(NVL(V_TOT_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);

                O_TOT_NET_AMT := (O_TOT_NET_AMT + O_NET_AMT)*TO_NUMBER(NVL(P_RM_CNT,'1'));
                O_TOT_SVC_AMT := (O_TOT_SVC_AMT + O_SVC_AMT)*TO_NUMBER(NVL(P_RM_CNT,'1'));
                O_TOT_VAT_AMT := (O_TOT_VAT_AMT + O_VAT_AMT)*TO_NUMBER(NVL(P_RM_CNT,'1'));
                                            
                O_TOT_AMT := O_TOT_NET_AMT + O_TOT_SVC_AMT + O_TOT_VAT_AMT;
                 
--                IF V_LIFE_YN = 'Y' AND  O_PVL_IND_CD <>'AA8' THEN
--                    O_TOT_NET_AMT             := '0';      -- 공급가액
--                    O_TOT_SVC_AMT             := '0';      -- 봉사료
--                    O_TOT_VAT_AMT             := '0';      -- 부가세액
--                    O_TOT_TAX_AMT             := '0';      -- 기금액
--                    O_RM_AMT                  := '0';      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)    
--                    O_VIEW_AMT                := '0';      -- 전망금액
--                    O_NON_VIEW_AMT            := '0';      -- 비전망금액
--                    O_TOT_AMT                 := '0';      -- 총금액
--                    O_BASE_AMT                := '0';      -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)    
--                    O_PKG_ADD_AMT             := '0';      -- 패키지추가금액
--                    O_DC_IND_CD               := '0';      -- 할인구분    
--                    O_DC_RATE                 := '0';      -- 할인율
--                    O_DC_AMT                  := '0';      -- 할인금액
--
--                 END IF;

                O_DC_AMT        := TO_NUMBER(O_BASE_AMT)-TO_NUMBER(NVL(O_RM_AMT,'0'));
                        
                SELECT SUBSTR(DECODE(O_BASE_AMT, NULL, 0, 0, 0, TRUNC(TO_NUMBER(NVL(O_DC_AMT,'0')) / TO_NUMBER(O_BASE_AMT) * 100, 2)),1,6)
                  INTO O_DC_RATE
                  FROM DUAL;
                  
                 --PKG_RSLLOG.SP_INSERT ('SF_DC_MAIN','O_RM_AMT:' || O_RM_AMT);
                 PIPE ROW (TYPE_DC_MAIN (V_CI_YMD             ,    -- 체크인일자
                                    P_RM_CNT                  ,    -- 객실수
                                    O_RESULT_MEM_NO           ,    -- 실적우대번호
                                    O_TOT_NET_AMT             ,    -- 공급가액
                                    O_TOT_SVC_AMT             ,    -- 봉사료
                                    O_TOT_VAT_AMT             ,    -- 부가세액
                                    O_TOT_TAX_AMT             ,    -- 기금액
                                    NVL(O_RM_ADD_AMT,0)       ,    -- 추가금액    
                                    NVL(O_RM_AMT,0)           ,    -- 적용금액(투숙사용-전망,비전망 구분에 따른요금)    
                                    NVL(O_VIEW_AMT,0)         ,    -- 전망금액
                                    NVL(O_NON_VIEW_AMT,0)     ,    -- 비전망금액
                                    NVL(O_TOT_AMT,0)          ,    -- 총금액
                                    NVL(O_BASE_AMT,0)         ,    -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)
                                    NVL(O_ORG_RM_AMT,0)       ,    -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)
                                    NVL(V_TOT_PKG_ADD_AMT,0)  ,    -- 패키지추가금액
                                    O_DC_IND_CD               ,    -- 할인구분    
                                    O_DC_RATE                 ,    -- 할인율
                                    NVL(O_DC_AMT,0)           ,    -- 할인금액    
                                    O_LONG_DC_RATE            ,    -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%)  
                                    O_LONG_DC_RATE_NM         ,    -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%)  
                                    O_MENU_CD                 ,    -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                                    O_MENU_NM                 ,    -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                                    O_MEM_IND                 ,    -- 고객구분(member_code) 
                                    O_MEM_NM                  ,    -- 회원명
                                    O_FAMILY_NM               ,    -- 가족명
                                    O_PVL_IND_CD              ,    -- 우대구분
                                    O_PVL_IND_NM              ,    -- 우대구분명
                                    O_PVL_BGN_YMD             ,    -- 우대적용시작일자
                                    O_PVL_END_YMD             ,    -- 우대종료일자
                                    SUBSTR(O_JUMIN_NO,1,2)    ,    -- 주민등록번호/사업자등록번호
                                    O_SALE_YN                 ,    -- 발권(판매)가능여부 (      사용안함?사업장도?       )  
                                    O_USE_TOT_CNT             ,    -- 사용일수(남은일수) 
                                    O_GUEST_KIND              ,    -- 고객유형(C0009) 
                                    O_GUEST_KIND_NM           ,    -- 고객유형명(C0009) 
                                    O_SEASON_CD               ,    -- 시즌코드
                                    O_SEASON_NM               ,    -- 시즌코드명
                                    O_CALC_IND_CD             ,    -- 정산구분(C0011-현지직불,후불,선납) 
                                    O_CALC_IND_NM             ,    -- 정산구분(C0011-현지직불,후불,선납) 
                                    O_MSG                     ,    -- 비고
                                    O_ERR_CD                  ,    -- 에러코드
                                    O_RATE_SEARCH_ALL         ,    -- 요금조회시 모든조건  20100224 
                                    O_MEMBER_KIND             ,    -- 회원분류 101202 
                                    O_SPECL_BNFT_GUEST_YN     ,    -- 특별혜택적용여부 101202 
                                    O_LONG_SBSCRB_DC_AMT      ,    -- 장기가입우대서비스 정상요금  
                                    O_MARKET_CD               ,
                                    O_MARKET_NM               ,
                                    V_INIT_ADULT_CNT          ,
                                    V_INIT_CHILD_CNT          ,
                                    O_ETC_01                  ,
                                    O_ETC_02                  ,
                                    O_ETC_03                  ,
                                    O_ETC_04                  ,
                                    O_ETC_05                  ,
                                    O_RESULT                       -- TO-BE 에러처리코드          
                                   )
                            );    
                 V_CI_YMD := TO_CHAR(TO_DATE(V_CI_YMD,'YYYYMMDD') + 1,'YYYYMMDD');                                
            END LOOP;
            
        ELSE
            --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','1: V_MENU_CD >>'||V_MENU_CD || 'V_RM_AMT_CD_IND >>'||V_RM_AMT_CD_IND || 'NVL(TRIM(P_JOB),''ZZ'') >>'||NVL(TRIM(P_JOB),'ZZ') || 'V_GNRL_RSV_YN >>'||V_GNRL_RSV_YN,'TEST','TEST','TEST','Y');
            --DBMS_OUTPUT.Put_Line('FIT로 이상하네.>>>여기 들어왔넹1');
            BEGIN
                SELECT MAIN_MEM_NO
                      ,MEM_IND
                      ,EMPL_RETIRE_YMD
                  INTO V_RESULT_MEM_NO
                      ,V_MEM_IND
                      ,V_RETIRE_YMD              
                  FROM MEM_UNITY_MEM
                 WHERE MEM_NO = P_MEM_NO
                ;
                
                
                
                O_PVL_IND_CD := 'ZZZ';
                O_PVL_IND_NM := 'OPEN CODE';
                
--                PKG_RSVLOGRM.SP_INSERT('SF_DC_MAIN','1207 O_PVL_IND_CD '||O_PVL_IND_CD ,'TEST','TEST','TEST','Y');
                
              
                SP_RSVGETGUESTKIND(
                                  P_STORE_CD        ,      -- 영업장코드
                                  V_RESULT_MEM_NO   ,      -- 회원번호
                                  V_MEM_IND         ,      -- 회원구분
                                  V_RETIRE_YMD      ,      -- 직원퇴사일자
                                  P_USER_IND_CD     ,      -- 사용자구분코드
                                  P_RSV_IND_CD      ,      -- 예약구분코드
                                  P_CUPON_NO        ,      -- 예약구분코드
                                  ''                ,      -- 마켓코드
                                  O_RM_AMT          ,      -- 객실요금
                                  O_GUEST_KIND      ,      -- 고객유형
                                  O_GUEST_KIND_NM   ,      -- 고객유형명
                                  O_RESULT          ,
                                  O_MSG             ,       
                                  P_MSG_LANG_TYPE        -- 오류MSG언어유형
                                );
             
            EXCEPTION 
            WHEN NO_DATA_FOUND THEN
                NULL;
            END;
            
            FOR  V_LOOP IN  1..V_NIGHTS   LOOP
            --DBMS_OUTPUT.Put_Line('V_CI_YMD >>>'||V_CI_YMD);
                O_TOT_NET_AMT                 := '0';      -- 공급가액
                O_TOT_SVC_AMT                 := '0';      -- 봉사료
                O_TOT_VAT_AMT                 := '0';      -- 부가세액
                O_TOT_TAX_AMT                 := '0';      -- 기금액
                O_RM_AMT                  := '0';      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)    
                O_VIEW_AMT                := '0';      -- 전망금액
                O_NON_VIEW_AMT            := '0';      -- 비전망금액
                O_TOT_AMT                 := '0';      -- 총금액
                O_BASE_AMT                := '0';      -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)
                O_ORG_RM_AMT              := '0';      -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)    
                O_PKG_ADD_AMT             := '0';      -- 패키지추가금액
                O_DC_IND_CD               := '0';      -- 할인구분    
                O_DC_RATE                 := '0';      -- 할인율
                O_DC_AMT                  := '0';      -- 할인금액
                V_INIT_ADULT_CNT          := 0;        -- 패키지기준인원수(FIT외에는 1로 한다)
                V_INIT_CHILD_CNT          := 0;        -- 패키지기준인원수(FIT외에는 1로 한다)
                V_TOT_PKG_ADD_AMT         := 0;
                
                IF TRIM(P_CI_NO) IS NOT NULL THEN
                    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','3 P_CI_NO >>'||P_CI_NO);

                        IF NVL(P_EXPT_YN,'0') = V_ORG_EXPT_YN AND NVL(P_EXPT_YN,'0') = '1' AND V_ORG_EXPT_AMT = TO_NUMBER(NVL(P_EXPT_AMT,'0')) THEN
                            BEGIN
                                SELECT TO_CHAR(NVL(RM_AMT,0))
                                  INTO V_EXPT_AMT
                                  FROM RSL_DAIL_RM_AMT
                                 WHERE CI_NO    = P_CI_NO
                                   AND OPRT_YMD = V_CI_YMD
                                ;
                            EXCEPTION
                            WHEN OTHERS THEN
                                NULL;
                            END;
                        END IF;
                            

                ELSIF TRIM(P_KEY_RSV_NO) IS NOT NULL THEN
                    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','4 P_KEY_RSV_NO >>'||P_KEY_RSV_NO);
      
                        IF NVL(P_EXPT_YN,'0') = V_ORG_EXPT_YN AND NVL(P_EXPT_YN,'0') = '1' AND V_ORG_EXPT_AMT = TO_NUMBER(NVL(P_EXPT_AMT,'0')) THEN
                            BEGIN
                                SELECT TO_CHAR(NVL(RM_AMT,0))
                                  INTO V_EXPT_AMT
                                  FROM RSV_DAIL_RM_AMT
                                 WHERE KEY_RSV_NO   = P_KEY_RSV_NO
                                   AND OPRT_YMD     = V_CI_YMD
                                ;
                            EXCEPTION
                            WHEN OTHERS THEN
                                NULL;
                            END;
                        END IF;
                            
                ELSE
                    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','5 V_MENU_CD >>'||V_MENU_CD);
                    NULL;
                END IF;
                
                IF V_GNRL_RSV_YN = '0' AND V_MENU_CD IS NULL THEN
                
                
                    -- ZA는 입력된 금액으로 해준다.
                    
                    O_MENU_CD := 'ZA';
                    
                    SELECT RM_RSV_AMT_SEASON_IND_CD
                      INTO O_SEASON_CD
                      FROM TABLE (
                              PKG_SSL_MST_CLDR.SF_SSL_MST_CLDR (P_STORE_CD
                                                               ,P_MEM_NO
                                                               ,V_CI_YMD))
                     WHERE RM_RSV_AMT_SEASON_IND_CD IN
                              (SELECT COMM_CD
                                 FROM SYS_COMM_CD
                                WHERE COMM_TYPE_CD = 'RSL0008')
                       AND SALE_YMD = V_CI_YMD;
                    
                    SELECT
                          MENU_NM                       /* 메뉴코드(SSL_UNITY_MENU) */
                         ,MARKET_CD                     /* 마켓코드(RSV_MARKET_CD) */
                         ,SF_GETRSVMARKETCDNM(MARKET_CD) MARKET_NM                     /* 마켓코드(RSV_MARKET_CD) */
                         ,SF_GETSYSCOMMCDNM('RSL0008',O_SEASON_CD) SEASON_NM             /* 시즌코드(RSL0008) */
                     INTO O_MENU_NM
                         ,O_MARKET_CD
                         ,O_MARKET_NM
                         ,O_SEASON_NM
                    FROM RSV_RM_AMT_CD
                   WHERE STORE_CD = P_STORE_CD
                     AND MENU_CD  = O_MENU_CD
                   ;
                   
                   O_RESULT_MEM_NO := P_MEM_NO;
                   O_CALC_IND_CD   := '0';
                   
                   SELECT CALC_IND, SF_GETMEMNM(MEM_NO), MEM_IND, MEM_KIND
                     INTO O_CALC_IND_CD, O_MEM_NM, O_MEM_IND, O_MEMBER_KIND
                     FROM MEM_UNITY_MEM
                    WHERE MEM_NO = P_MEM_NO
                   ;    
                                                                    
                   O_RM_AMT        := TO_NUMBER(V_EXPT_AMT);      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)
                   
                --ELSIF V_MENU_CD <> 'ZA' THEN
                ELSIF V_MENU_CD NOT LIKE ('ZA%') AND P_MEM_NO NOT LIKE '87%' THEN
                    
                    BEGIN
                        SELECT
                              B.MENU_NM                       /* 메뉴코드(SSL_UNITY_MENU) */
                             ,B.MARKET_CD                     /* 마켓코드(RSV_MARKET_CD) */
                             ,SF_GETRSVMARKETCDNM(B.MARKET_CD) MARKET_NM                     /* 마켓코드(RSV_MARKET_CD) */
                             ,A.SEASON_CD                     /* 시즌코드(RSL0008) */
                             ,SF_GETSYSCOMMCDNM('RSL0008',A.SEASON_CD) SEASON_NM             /* 시즌코드(RSL0008) */
                             ,A.NET_AMT                       /* 공급가금액 */
                             ,A.SVC_AMT                       /* 봉사료금액 */
                             ,A.VAT_AMT                       /* 부가세금액 */
                             ,A.RM_AMT                        /* 객실료금액 */
                             --,NVL(B.PKG_ADD_AMT,0) PKG_ADD_AMT                   /* 패키지금액 */
                             ,NVL(A.INIT_ADULT_CNT,0) INIT_ADULT_CNT
                             ,NVL(A.INIT_CHILD_CNT,0) INIT_CHILD_CNT
                             ,NVL(B.ADULT_ADD_AMT,0) INIT_ADULT_AMT
                             ,NVL(B.CHILD_ADD_AMT,0) INIT_CHILD_AMT
                         INTO O_MENU_NM
                             ,O_MARKET_CD
                             ,O_MARKET_NM
                             ,O_SEASON_CD
                             ,O_SEASON_NM
                             ,O_NET_AMT
                             ,O_SVC_AMT
                             ,O_VAT_AMT
                             ,O_RM_AMT
                             ,V_INIT_ADULT_CNT
                             ,V_INIT_CHILD_CNT
                             ,V_INIT_ADULT_AMT
                             ,V_INIT_CHILD_AMT
                         FROM FOFADM.RSV_RM_AMT_DTL_WD A, FOFADM.RSV_RM_AMT_CD B, FOFADM.RSV_RM_TYPE_CD C
                        WHERE A.STORE_CD                      =  B.STORE_CD
                          AND A.MENU_CD                       =  B.MENU_CD
                          AND A.STORE_CD                      =  C.STORE_CD
                          AND A.RM_TYPE_CD                    =  C.RM_TYPE_CD
                          AND B.USE_YN                        =  '1'
                          AND A.WD_CD                         =  TO_CHAR(TO_DATE(V_CI_YMD,'YYYYMMDD'),'D')
                          AND A.STORE_CD                      =  P_STORE_CD
                          AND A.RM_TYPE_CD                    =  P_RM_TYPE_CD
                          AND V_CI_YMD                        BETWEEN APPLY_BGN_YMD AND APPLY_END_YMD
    --                      AND A.APPLY_BGN_YMD                 IN (SELECT MAX(APPLY_BGN_YMD)
    --                                                                FROM FOFADM.RSV_RM_AMT_DTL_WD C
    --                                                               WHERE 1=1
    --                                                                 AND C.STORE_CD      =  A.STORE_CD
    --                                                                 AND C.RM_TYPE_CD    =  A.RM_TYPE_CD
    --                                                                 AND C.MENU_CD       =  A.MENU_CD
    --                                                                 AND C.SEASON_CD     =  A.SEASON_CD
    --                                                                 AND C.APPLY_BGN_YMD <= V_CI_YMD
    --                                                             )
                          AND A.SEASON_CD                     =   ( SELECT RM_RSV_AMT_SEASON_IND_CD
                                                                      FROM TABLE (
                                                                              PKG_SSL_MST_CLDR.SF_SSL_MST_CLDR (A.STORE_CD
                                                                                                               ,P_MEM_NO
                                                                                                               ,V_CI_YMD))
                                                                     WHERE RM_RSV_AMT_SEASON_IND_CD IN
                                                                              (SELECT COMM_CD
                                                                                 FROM SYS_COMM_CD
                                                                                WHERE COMM_TYPE_CD = 'RSL0008')
                                                                       AND SALE_YMD = V_CI_YMD
                                                                   )
                          AND A.MENU_CD = O_MENU_CD;

                    EXCEPTION
                    WHEN NO_DATA_FOUND THEN
                        O_ERR_CD := '9999';
                        O_MSG := '요금이 설정되지 않았습니다.';
                    END
                    ;
                ELSE
                    -- ZA는 입력된 금액으로 해준다.
                    
                    SELECT RM_RSV_AMT_SEASON_IND_CD
                      INTO O_SEASON_CD
                      FROM TABLE (
                              PKG_SSL_MST_CLDR.SF_SSL_MST_CLDR (P_STORE_CD
                                                               ,P_MEM_NO
                                                               ,V_CI_YMD))
                     WHERE RM_RSV_AMT_SEASON_IND_CD IN
                              (SELECT COMM_CD
                                 FROM SYS_COMM_CD
                                WHERE COMM_TYPE_CD = 'RSL0008')
                       AND SALE_YMD = V_CI_YMD;
                    
                    SELECT
                          MENU_NM                       /* 메뉴코드(SSL_UNITY_MENU) */
                         ,MARKET_CD                     /* 마켓코드(RSV_MARKET_CD) */
                         ,SF_GETRSVMARKETCDNM(MARKET_CD) MARKET_NM                     /* 마켓코드(RSV_MARKET_CD) */
                         ,SF_GETSYSCOMMCDNM('RSL0008',O_SEASON_CD) SEASON_NM             /* 시즌코드(RSL0008) */
                     INTO O_MENU_NM
                         ,O_MARKET_CD
                         ,O_MARKET_NM
                         ,O_SEASON_NM
                    FROM RSV_RM_AMT_CD
                   WHERE STORE_CD = P_STORE_CD
                     AND MENU_CD  = O_MENU_CD
                   ;
                   O_RESULT_MEM_NO := P_MEM_NO;
                   O_CALC_IND_CD   := '0';
                   SELECT CALC_IND, SF_GETMEMNM(MEM_NO), MEM_IND, MEM_KIND
                     INTO O_CALC_IND_CD, O_MEM_NM, O_MEM_IND, O_MEMBER_KIND
                     FROM MEM_UNITY_MEM
                    WHERE MEM_NO = P_MEM_NO
                   ;                                                     
                   O_RM_AMT        := TO_NUMBER(V_EXPT_AMT);      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)
                    
                END IF;
                          
                FOR I IN (SELECT PKG_NO
                                ,NVL(ADULT_CNT_IF_YN,'0') AS ADULT_CNT_IF_YN 
                                ,NVL(CHILD_CNT_IF_YN,'0') AS CHILD_CNT_IF_YN
                                ,NIGHTS_IF_YN
                                ,DECODE(NVL(NIGHTS_IF_YN,'0'), '0', DECODE(P_CI_YMD, V_CI_YMD, SF_PKG_BREAKFAST_AMT(PKG_NO, V_CI_YMD), 0), SF_PKG_BREAKFAST_AMT(PKG_NO, V_CI_YMD)) AS PKG_ADD_AMT
                            FROM RSV_RM_AMT_PKG
                           WHERE STORE_CD = P_STORE_CD
                             AND MENU_CD  = O_MENU_CD
                         )
                LOOP
                    -- 대인수연동
                    IF I.ADULT_CNT_IF_YN = '1' THEN
                        IF TO_NUMBER(NVL(P_ADULT_CNT,0)) > 0 THEN
                            IF TO_NUMBER(P_ADULT_CNT) > 0 THEN
                                O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT * TO_NUMBER(P_ADULT_CNT);
                            ELSE
                                O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;  
                            END IF;
                        END IF;
                    -- 소인수 연동
                    ELSIF I.CHILD_CNT_IF_YN = '1' THEN
                        IF TO_NUMBER(NVL(P_CHILD_CNT,0)) > 0 THEN
                            IF TO_NUMBER(P_CHILD_CNT) > 0 THEN
                                O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT * TO_NUMBER(P_CHILD_CNT);
                            ELSE
                                O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;
                            END IF;
                        END IF;
                    ELSE
                        O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;
                    END IF;
                            
                END LOOP;
                             

                    
                    
                    
            --DBMS_OUTPUT.Put_Line('O_RM_AMT >>>'||O_RM_AMT);
                
                O_BASE_AMT := O_RM_AMT;


                IF V_INIT_ADULT_CNT < P_ADULT_CNT THEN
                    V_OVER_ADULT_AMT := V_INIT_ADULT_AMT * (P_ADULT_CNT - V_INIT_ADULT_CNT);
                END IF;

                IF V_INIT_CHILD_CNT < P_CHILD_CNT THEN
                    V_OVER_CHILD_AMT := V_INIT_CHILD_AMT * (P_CHILD_CNT - V_INIT_CHILD_CNT);
                END IF;
                    
                O_RM_ADD_AMT := TO_CHAR(V_OVER_ADULT_AMT + V_OVER_CHILD_AMT);
                                    
                -- 예외적용
                IF V_EXPT_YN = '1' THEN
                    
                    O_DC_AMT        := TO_NUMBER(O_BASE_AMT)-TO_NUMBER(NVL(V_EXPT_AMT,'0'));
                        
                    SELECT SUBSTR(DECODE(O_BASE_AMT, NULL, 0, 0, 0, TRUNC(TO_NUMBER(NVL(O_DC_AMT,'0')) / TO_NUMBER(O_BASE_AMT) * 100, 2)),1,6)
                      INTO O_DC_RATE 
                      FROM DUAL;
                        
                    O_RM_AMT        := V_EXPT_AMT;      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)
                    O_RM_ADD_AMT    := 0;    
                    O_TOT_AMT       := TO_NUMBER(O_RM_AMT) + TO_NUMBER(O_PKG_ADD_AMT);
--                ELSIF V_MENU_CD = 'ZA' THEN
--                    O_BASE_AMT      := V_EXPT_AMT;
--                    
--                    O_DC_AMT        := TO_NUMBER(O_BASE_AMT)-TO_NUMBER(NVL(V_EXPT_AMT,'0'));
--                    
--                    SELECT DECODE(O_BASE_AMT, NULL, 0, 0, 0, TRUNC(TO_NUMBER(NVL(O_DC_AMT,'0')) / TO_NUMBER(O_BASE_AMT) * 100, 2))
--                      INTO O_DC_RATE
--                      FROM DUAL;
--                      
--                    O_RM_AMT        := V_EXPT_AMT;      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)    
--                    O_TOT_AMT       := TO_NUMBER(O_RM_AMT) + TO_NUMBER(O_PKG_ADD_AMT);
                    
                END IF;
                
                O_ORG_RM_AMT    := TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0'));
                O_TOT_NET_AMT   := SF_NET_AMT_CALC((TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
                O_TOT_SVC_AMT   := SF_SERVICE_AMT_CALC((TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
                O_TOT_VAT_AMT   := SF_VAT_AMT_CALC((TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
                 
                O_NET_AMT       := SF_NET_AMT_CALC(TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
                O_SVC_AMT       := SF_SERVICE_AMT_CALC(TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
                O_VAT_AMT       := SF_VAT_AMT_CALC(TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
                
                O_RM_AMT        := NVL(O_NET_AMT,0) + NVL(O_SVC_AMT,0) + NVL(O_VAT_AMT,0);
                 
                O_PKG_ADD_AMT   := NVL(SF_NET_AMT_CALC(TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0),0)
                                 + NVL(SF_SERVICE_AMT_CALC(TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0),0)
                                 + NVL(SF_VAT_AMT_CALC(TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0),0);
                                 
                O_TOT_AMT       := (TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1'));
                
                
                                

                O_RESULT        := 0;
                
                PIPE ROW (TYPE_DC_MAIN (V_CI_YMD              ,    -- 체크인일자
                                    P_RM_CNT                  ,    -- 객실수
                                    O_RESULT_MEM_NO           ,    -- 실적우대번호
                                    O_TOT_NET_AMT             ,    -- 공급가액
                                    O_TOT_SVC_AMT             ,    -- 봉사료
                                    O_TOT_VAT_AMT             ,    -- 부가세액
                                    O_TOT_TAX_AMT             ,    -- 기금액
                                    NVL(O_RM_ADD_AMT,0)       ,    -- 추가금액    
                                    NVL(O_RM_AMT,0)           ,    -- 적용금액(투숙사용-전망,비전망 구분에 따른요금)    
                                    NVL(O_VIEW_AMT,0)         ,    -- 전망금액
                                    NVL(O_NON_VIEW_AMT,0)     ,    -- 비전망금액
                                    NVL(O_TOT_AMT,0)          ,    -- 총금액
                                    NVL(O_BASE_AMT,0)         ,    -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)
                                    NVL(O_ORG_RM_AMT,0)       ,    -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)
                                    NVL(O_PKG_ADD_AMT,0)      ,    -- 패키지추가금액
                                    O_DC_IND_CD               ,    -- 할인구분    
                                    O_DC_RATE                 ,    -- 할인율
                                    NVL(O_DC_AMT,0)           ,    -- 할인금액    
                                    O_LONG_DC_RATE            ,    -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%)  
                                    O_LONG_DC_RATE_NM         ,    -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%)  
                                    O_MENU_CD                 ,    -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                                    O_MENU_NM                 ,    -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                                    O_MEM_IND                 ,    -- 고객구분(member_code) 
                                    O_MEM_NM                  ,    -- 회원명
                                    O_FAMILY_NM               ,    -- 가족명
                                    O_PVL_IND_CD              ,    -- 우대구분
                                    O_PVL_IND_NM              ,    -- 우대구분명
                                    O_PVL_BGN_YMD             ,    -- 우대적용시작일자
                                    O_PVL_END_YMD             ,    -- 우대종료일자
                                    O_JUMIN_NO                ,    -- 주민등록번호/사업자등록번호
                                    O_SALE_YN                 ,    -- 발권(판매)가능여부 (      사용안함?사업장도?       )  
                                    O_USE_TOT_CNT             ,    -- 사용일수(남은일수) 
                                    O_GUEST_KIND              ,    -- 고객유형(C0009) 
                                    O_GUEST_KIND_NM           ,    -- 고객유형명(C0009) 
                                    O_SEASON_CD               ,    -- 시즌코드
                                    O_SEASON_NM               ,    -- 시즌코드명
                                    O_CALC_IND_CD             ,    -- 정산구분(C0011-현지직불,후불,선납) 
                                    O_CALC_IND_NM             ,    -- 정산구분(C0011-현지직불,후불,선납) 
                                    O_MSG                     ,    -- 비고
                                    O_ERR_CD                  ,    -- 에러코드
                                    O_RATE_SEARCH_ALL         ,    -- 요금조회시 모든조건  20100224 
                                    O_MEMBER_KIND             ,    -- 회원분류 101202 
                                    O_SPECL_BNFT_GUEST_YN     ,    -- 특별혜택적용여부 101202 
                                    O_LONG_SBSCRB_DC_AMT      ,    -- 장기가입우대서비스 정상요금  
                                    O_MARKET_CD               ,
                                    O_MARKET_NM               ,
                                    V_INIT_ADULT_CNT          ,
                                    V_INIT_CHILD_CNT          ,
                                    O_ETC_01                  ,
                                    O_ETC_02                  ,
                                    O_ETC_03                  ,
                                    O_ETC_04                  ,
                                    O_ETC_05                  ,
                                    O_RESULT                       -- TO-BE 에러처리코드          
                                   )
                            );
                            
                 V_CI_YMD := TO_CHAR(TO_DATE(V_CI_YMD,'YYYYMMDD') + 1,'YYYYMMDD');
                                           
            END LOOP;
        END IF;
        
    ELSE

        
        BEGIN
            SELECT MENU_CD
              INTO V_DEFAULT_RATE_CD
              FROM RSV_RM_AMT_CD
             WHERE STND_YN  = '1'
               AND STORE_CD = P_STORE_CD
               AND USE_YN   = '1'
            ;
                
        EXCEPTION
            WHEN OTHERS THEN
                V_DEFAULT_RATE_CD := 'RACK';
                
        END; 
                     
        
        FOR  V_LOOP IN  1..V_NIGHTS   LOOP
            IF V_MENU_CD IS NULL THEN
            
                --디테일용  
--                BEGIN
--                    SELECT APPLY_BGN_YMD, APPLY_END_YMD
--                      INTO V_APPLY_BGN_YMD, V_APPLY_END_YMD
--                      FROM RSV_RM_AMT_DAIL_STND_TYPE T1
--                     WHERE T1.APPLY_BGN_YMD = (SELECT MAX(APPLY_BGN_YMD)
--                                                 FROM RSV_RM_AMT_DAIL_STND_TYPE
--                                                WHERE APPLY_BGN_YMD  <= V_CI_YMD
--                                                  AND STORE_CD       =  P_STORE_CD
--                                                  AND RM_TYPE_CD     =  P_RM_TYPE_CD)
--                       AND T1.STORE_CD      = P_STORE_CD
--                       AND T1.RM_TYPE_CD    = P_RM_TYPE_CD
--                    ;
--                EXCEPTION WHEN OTHERS THEN
--                    V_APPLY_BGN_YMD := '';
--                    V_APPLY_END_YMD := '';
--                        
--                END;
                    
                BEGIN
                    --     SELECT DECODE(T1.MENU_CD, NULL, V_DEFAULT_RATE_CD, T1.MENU_CD)
                    SELECT T1.MENU_CD
                      INTO O_MENU_CD
                      FROM RSV_RM_AMT_DAIL_STND_TYPE T1
                     WHERE V_CI_YMD         BETWEEN T1.APPLY_BGN_YMD AND T1.APPLY_END_YMD
                       AND T1.STORE_CD      = P_STORE_CD
                       AND T1.RM_TYPE_CD    = P_RM_TYPE_CD;
                    EXCEPTION 
                        WHEN OTHERS THEN
                            O_MENU_CD := V_DEFAULT_RATE_CD;
                END;
                        
                IF O_MENU_CD IS NULL THEN
                    O_MENU_CD := V_DEFAULT_RATE_CD;
                END IF;
            ELSIF P_DAIL_RM_AMT_REQS_YN = '1' THEN
            
                --디테일용  
--                BEGIN
--                    SELECT APPLY_BGN_YMD, APPLY_END_YMD
--                      INTO V_APPLY_BGN_YMD, V_APPLY_END_YMD
--                      FROM RSV_RM_AMT_DAIL_STND_TYPE T1
--                     WHERE T1.APPLY_BGN_YMD = (SELECT MAX(APPLY_BGN_YMD)
--                                                 FROM RSV_RM_AMT_DAIL_STND_TYPE
--                                                WHERE APPLY_BGN_YMD  <= V_CI_YMD
--                                                  AND STORE_CD       =  P_STORE_CD
--                                                  AND RM_TYPE_CD     =  P_RM_TYPE_CD)
--                       AND T1.STORE_CD      = P_STORE_CD
--                       AND T1.RM_TYPE_CD    = P_RM_TYPE_CD
--                    ;
--                EXCEPTION WHEN OTHERS THEN
--                    V_APPLY_BGN_YMD := '';
--                    V_APPLY_END_YMD := '';
--                        
--                END;
                    
                BEGIN
                    --     SELECT DECODE(T1.MENU_CD, NULL, V_DEFAULT_RATE_CD, T1.MENU_CD)
                    SELECT T1.MENU_CD
                      INTO O_MENU_CD
                      FROM RSV_RM_AMT_DAIL_STND_TYPE T1
                     WHERE V_CI_YMD         BETWEEN T1.APPLY_BGN_YMD AND T1.APPLY_END_YMD
                       AND T1.STORE_CD      = P_STORE_CD
                       AND T1.RM_TYPE_CD    = P_RM_TYPE_CD;
                    EXCEPTION 
                        WHEN OTHERS THEN
                            O_MENU_CD := V_DEFAULT_RATE_CD;
                END;
                        
                IF O_MENU_CD IS NULL THEN
                    O_MENU_CD := V_DEFAULT_RATE_CD;
                END IF;
            ELSE
                --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','0 V_CI_YMD >>'||V_CI_YMD);
                --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','1 P_CI_NO >>'||P_CI_NO);
                --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','2 P_KEY_RSV_NO >>'||P_KEY_RSV_NO);
                IF TRIM(P_CI_NO) IS NOT NULL THEN
                    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','3 P_CI_NO >>'||P_CI_NO);
                    BEGIN
                        
                        IF NVL(P_EXPT_YN,'0') = V_ORG_EXPT_YN AND NVL(P_EXPT_YN,'0') = '1' AND V_ORG_EXPT_AMT = TO_NUMBER(NVL(P_EXPT_AMT,'0')) THEN
                            BEGIN
                                SELECT TO_CHAR(NVL(RM_AMT,0))
                                  INTO V_EXPT_AMT
                                  FROM RSL_DAIL_RM_AMT
                                 WHERE CI_NO    = P_CI_NO
                                   AND OPRT_YMD = V_CI_YMD
                                ;
                            EXCEPTION
                            WHEN OTHERS THEN
                                NULL;
                            END;
                        END IF;
                        IF V_RM_AMT_CHG_YN <> '1' THEN
                        
                            BEGIN
                                SELECT MENU_CD
                                  INTO O_MENU_CD
                                  FROM RSL_DAIL_RM_AMT
                                 WHERE CI_NO    = P_CI_NO
                                   AND OPRT_YMD = V_CI_YMD
                                ;
                                V_MENU_CD := O_MENU_CD;
                            EXCEPTION
                            WHEN OTHERS THEN
                                IF V_LOOP = 1 THEN
                                    O_MENU_CD := V_RSV_MENU_CD;
                                    V_MENU_CD := O_MENU_CD;
                                ELSE
                                    O_MENU_CD := V_MENU_CD; 
                                END IF;
                            END;
                        
                        END IF;
--                        IF O_MENU_CD <> V_MENU_CD THEN
--                            O_MENU_CD := V_MENU_CD;
--                        ELSE
--                            BEGIN
--                                SELECT MENU_CD
--                                  INTO O_MENU_CD
--                                  FROM RSL_DAIL_RM_AMT
--                                 WHERE CI_NO    = P_CI_NO
--                                   AND OPRT_YMD = V_CI_YMD
--                                ;
--                            EXCEPTION
--                            WHEN OTHERS THEN
--                                --O_MENU_CD := V_MENU_CD;
--                                NULL;
--                            END;
--                        END IF;
                    EXCEPTION
                    WHEN OTHERS THEN
                        O_MENU_CD := V_MENU_CD;
                    END;
                ELSIF TRIM(P_KEY_RSV_NO) IS NOT NULL THEN
                    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','4 P_KEY_RSV_NO >>'||P_KEY_RSV_NO);
                    BEGIN
                        
                        IF NVL(P_EXPT_YN,'0') = V_ORG_EXPT_YN AND NVL(P_EXPT_YN,'0') = '1' AND V_ORG_EXPT_AMT = TO_NUMBER(NVL(P_EXPT_AMT,'0')) THEN
                            BEGIN
                                SELECT TO_CHAR(NVL(RM_AMT,0))
                                  INTO V_EXPT_AMT
                                  FROM RSV_DAIL_RM_AMT
                                 WHERE KEY_RSV_NO   = P_KEY_RSV_NO
                                   AND OPRT_YMD = V_CI_YMD
                                ;
                            EXCEPTION
                            WHEN OTHERS THEN
                                NULL;
                            END;
                        END IF;
                        
                        IF V_RM_AMT_CHG_YN <> '1' THEN

                            BEGIN
                                SELECT MENU_CD
                                  INTO O_MENU_CD
                                  FROM RSV_DAIL_RM_AMT
                                 WHERE KEY_RSV_NO   = P_KEY_RSV_NO
                                   AND OPRT_YMD     = V_CI_YMD
                                ;
                                V_MENU_CD := O_MENU_CD;
                            EXCEPTION
                            WHEN OTHERS THEN
                                IF V_LOOP = 1 THEN
                                    O_MENU_CD := V_RSV_MENU_CD;
                                    V_MENU_CD := O_MENU_CD;
                                ELSE
                                    O_MENU_CD := V_MENU_CD; 
                                END IF;
                            END;
                            
                        END IF;
                        --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','4-1 O_MENU_CD >>'||O_MENU_CD);
--                        IF O_MENU_CD <> V_MENU_CD THEN
--                            O_MENU_CD := V_MENU_CD;
--                        END IF;
                        --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','4-2 O_MENU_CD >>'||O_MENU_CD);
                    EXCEPTION
                    WHEN OTHERS THEN
                        O_MENU_CD := V_MENU_CD;
                    END; 
                ELSE
                    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','5 V_MENU_CD >>'||V_MENU_CD);
                    O_MENU_CD := V_MENU_CD;
                END IF;
                
            END IF;
            
            O_TOT_NET_AMT             := '0';      -- 공급가액
            O_TOT_SVC_AMT             := '0';      -- 봉사료
            O_TOT_VAT_AMT             := '0';      -- 부가세액
            O_TOT_TAX_AMT             := '0';      -- 기금액
            O_RM_AMT                  := '0';      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)    
            O_VIEW_AMT                := '0';      -- 전망금액
            O_NON_VIEW_AMT            := '0';      -- 비전망금액
            O_TOT_AMT                 := '0';      -- 총금액
            O_BASE_AMT                := '0';      -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)    
            O_ORG_RM_AMT              := '0';      -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)
            O_PKG_ADD_AMT             := '0';      -- 패키지추가금액
            O_DC_IND_CD               := '0';      -- 할인구분    
            O_DC_RATE                 := '0';      -- 할인율
            O_DC_AMT                  := '0';      -- 할인금액
            V_INIT_ADULT_CNT          := 0;        -- 패키지기준인원수(FIT외에는 1로 한다)
            V_INIT_CHILD_CNT          := 0;        -- 패키지기준인원수(FIT외에는 1로 한다)
            V_TOT_PKG_ADD_AMT         := 0;
                
            BEGIN
                SELECT
                      B.MENU_NM                       /* 메뉴코드(SSL_UNITY_MENU) */
                     ,B.MARKET_CD                     /* 마켓코드(RSV_MARKET_CD) */
                     ,SF_GETRSVMARKETCDNM(B.MARKET_CD) MARKET_NM                     /* 마켓코드(RSV_MARKET_CD) */
                     ,A.SEASON_CD                     /* 시즌코드(RSL0008) */
                     ,SF_GETSYSCOMMCDNM('RSL0008',A.SEASON_CD) SEASON_NM             /* 시즌코드(RSL0008) */
                     ,A.NET_AMT                       /* 공급가금액 */
                     ,A.SVC_AMT                       /* 봉사료금액 */
                     ,A.VAT_AMT                       /* 부가세금액 */
                     ,A.RM_AMT                        /* 객실료금액 */
                     --,NVL(B.PKG_ADD_AMT,0) PKG_ADD_AMT                   /* 패키지금액 */
                     ,NVL(A.INIT_ADULT_CNT,0) INIT_ADULT_CNT
                     ,NVL(A.INIT_CHILD_CNT,0) INIT_CHILD_CNT
                     ,NVL(B.ADULT_ADD_AMT,0) INIT_ADULT_AMT
                     ,NVL(B.CHILD_ADD_AMT,0) INIT_CHILD_AMT
                 INTO O_MENU_NM
                     ,O_MARKET_CD
                     ,O_MARKET_NM
                     ,O_SEASON_CD
                     ,O_SEASON_NM
                     ,O_NET_AMT
                     ,O_SVC_AMT
                     ,O_VAT_AMT
                     ,O_RM_AMT
                     ,V_INIT_ADULT_CNT
                     ,V_INIT_CHILD_CNT
                     ,V_INIT_ADULT_AMT
                     ,V_INIT_CHILD_AMT
                 FROM FOFADM.RSV_RM_AMT_DTL_WD A, FOFADM.RSV_RM_AMT_CD B, FOFADM.RSV_RM_TYPE_CD C
                WHERE A.STORE_CD                      =  B.STORE_CD
                  AND A.MENU_CD                       =  B.MENU_CD
                  AND A.STORE_CD                      =  C.STORE_CD
                  AND A.RM_TYPE_CD                    =  C.RM_TYPE_CD
                  AND B.USE_YN                        =  '1'
                  AND A.WD_CD                         =  TO_CHAR(TO_DATE(V_CI_YMD,'YYYYMMDD'),'D')
                  AND A.STORE_CD                      =  P_STORE_CD
                  AND A.RM_TYPE_CD                    =  P_RM_TYPE_CD
                  AND V_CI_YMD                        BETWEEN APPLY_BGN_YMD AND APPLY_END_YMD
--                  AND A.APPLY_BGN_YMD                 IN (SELECT MAX(APPLY_BGN_YMD)
--                                                            FROM FOFADM.RSV_RM_AMT_DTL_WD C
--                                                           WHERE 1=1
--                                                             AND C.STORE_CD      =  A.STORE_CD
--                                                             AND C.RM_TYPE_CD    =  A.RM_TYPE_CD
--                                                             AND C.MENU_CD       =  A.MENU_CD
--                                                             AND C.SEASON_CD     =  A.SEASON_CD
--                                                             AND C.APPLY_BGN_YMD <= V_CI_YMD
--                                                         )
                  AND A.SEASON_CD                     =   ( SELECT RM_RSV_AMT_SEASON_IND_CD
                                                              FROM TABLE (
                                                                      PKG_SSL_MST_CLDR.SF_SSL_MST_CLDR (A.STORE_CD
                                                                                                       ,P_MEM_NO
                                                                                                       ,V_CI_YMD))
                                                             WHERE RM_RSV_AMT_SEASON_IND_CD IN
                                                                      (SELECT COMM_CD
                                                                         FROM SYS_COMM_CD
                                                                        WHERE COMM_TYPE_CD = 'RSL0008')
                                                               AND SALE_YMD = V_CI_YMD
                                                           )     
                  AND A.MENU_CD = O_MENU_CD;
                  
                O_PKG_ADD_AMT := '0';
                
                FOR I IN (SELECT PKG_NO
                                ,NVL(ADULT_CNT_IF_YN,'0') AS ADULT_CNT_IF_YN 
                                ,NVL(CHILD_CNT_IF_YN,'0') AS CHILD_CNT_IF_YN
                                ,NIGHTS_IF_YN
                                ,DECODE(NVL(NIGHTS_IF_YN,'0'), '0', DECODE(P_CI_YMD, V_CI_YMD, SF_PKG_BREAKFAST_AMT(PKG_NO, V_CI_YMD), 0), SF_PKG_BREAKFAST_AMT(PKG_NO, V_CI_YMD)) AS PKG_ADD_AMT
                            FROM RSV_RM_AMT_PKG
                           WHERE STORE_CD = P_STORE_CD
                             AND MENU_CD  = O_MENU_CD
                         )
                LOOP
                    
                    -- 대인수연동
                    IF I.ADULT_CNT_IF_YN = '1' THEN
                        IF TO_NUMBER(NVL(P_ADULT_CNT,0)) > 0 THEN
                            IF TO_NUMBER(P_ADULT_CNT) > 0 THEN
                                O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT * TO_NUMBER(P_ADULT_CNT);
                            ELSE
                                O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;  
                            END IF;
                        END IF;
                    -- 소인수 연동
                    ELSIF I.CHILD_CNT_IF_YN = '1' THEN
                        IF TO_NUMBER(NVL(P_CHILD_CNT,0)) > 0 THEN
                            IF TO_NUMBER(P_CHILD_CNT) > 0 THEN
                                O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT * TO_NUMBER(P_CHILD_CNT);
                            ELSE
                                O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;
                            END IF;
                        END IF;
                    ELSE
                        O_PKG_ADD_AMT := TO_NUMBER(O_PKG_ADD_AMT) + I.PKG_ADD_AMT;
                    END IF;

                        
                END LOOP;
            EXCEPTION
            WHEN NO_DATA_FOUND THEN
                O_ERR_CD := '9999';
                O_MSG := '요금이 설정되지 않았습니다.';
            END
            ;
            
            
            BEGIN
                SELECT MAIN_MEM_NO
                      ,MEM_IND
                      ,EMPL_RETIRE_YMD
                  INTO V_RESULT_MEM_NO
                      ,V_MEM_IND
                      ,V_RETIRE_YMD              
                  FROM MEM_UNITY_MEM
                 WHERE MEM_NO = P_MEM_NO
                ;
                
                O_PVL_IND_CD := '999';
                O_PVL_IND_NM := '일반 추천 우대없음';


                SELECT MARKET_CD 
                  INTO O_MARKET_CD
                  FROM RSV_RM_AMT_CD
                 WHERE STORE_CD = P_STORE_CD
                   AND MENU_CD  = O_MENU_CD
                ;
            EXCEPTION 
            WHEN NO_DATA_FOUND THEN
                NULL;
            END;
            
            SP_RSVGETGUESTKIND(
                              P_STORE_CD        ,      -- 영업장코드
                              V_RESULT_MEM_NO   ,      -- 회원번호
                              V_MEM_IND         ,      -- 회원구분
                              V_RETIRE_YMD      ,      -- 직원퇴사일자
                              P_USER_IND_CD     ,      -- 사용자구분코드
                              P_RSV_IND_CD      ,      -- 예약구분코드
                              P_CUPON_NO        ,      -- 예약구분코드
                              O_MARKET_CD       ,      -- 마켓코드
                              O_RM_AMT          ,      -- 객실요금
                              O_GUEST_KIND      ,      -- 고객유형
                              O_GUEST_KIND_NM   ,      -- 고객유형명
                              O_RESULT          ,
                              O_MSG             ,       
                              P_MSG_LANG_TYPE        -- 오류MSG언어유형
                            );
                            
                            
                        -- SF_DC_MAIN
            -- 지역별 FIT 회원번호 조회 (BB010MS용)
            IF ((P_MEM_NO IS NULL) OR (P_MEM_NO = '09048300')) THEN
                -- 지역별 FIT 회원번호 조회 (BB010MS용)
                BEGIN
                    SELECT NVL(NVL( (SELECT MARKET_IND_CD FROM RSV_MARKET_CD WHERE MARKET_CD =O_MARKET_CD AND USE_YN = '1')  , ITEM_05),'90')
                         , ITEM_06
                      INTO O_GUEST_KIND,
                           O_PVL_IND_CD
                      FROM SYS_COMM_CD
                     WHERE COMM_TYPE_CD = 'MEM0027'
                       AND COMM_CD      = P_STORE_CD||'00'
                    ;
                EXCEPTION 
                    WHEN NO_DATA_FOUND THEN
                        O_GUEST_KIND := '90';
                        O_PVL_IND_CD := '999';
                END;
                               
            ELSE
                SELECT NVL((SELECT COMM_CD 
                            FROM SYS_COMM_CD 
                           WHERE COMM_TYPE_CD = 'RSV0015'   --예약집계구분(GUEST_KIND)
                             AND ITEM_01      = 'Y'   
                             AND ITEM_02      = DECODE((SELECT MEM_IND      
                                                        FROM MEM_UNITY_MEM
                                                       WHERE  MEM_NO = P_MEM_NO)
                                                 ,'71','70','72','70','73','70','74','70','75','70','76','70','77','70','79','70',
                                                     (SELECT MEM_IND
                                                        FROM MEM_UNITY_MEM
                                                       WHERE MEM_NO = P_MEM_NO))
                                                         AND ITEM_03     = 'Y'
                                                         AND ITEM_04     = 'N'), 'ZZ') AS GUEST_KIND,--GUEST_KIND
                       PVL_IND_CD
                  INTO O_GUEST_KIND,
                       O_PVL_IND_CD
                  FROM MEM_UNITY_MEM
                 WHERE MEM_NO    = P_MEM_NO;
                            
            END IF;
                            
                            
            O_BASE_AMT := O_RM_AMT;
            
            IF V_INIT_ADULT_CNT < P_ADULT_CNT THEN
                V_OVER_ADULT_AMT := V_INIT_ADULT_AMT * (P_ADULT_CNT - V_INIT_ADULT_CNT);
            END IF;

            IF V_INIT_CHILD_CNT < P_CHILD_CNT THEN
                V_OVER_CHILD_AMT := V_INIT_CHILD_AMT * (P_CHILD_CNT - V_INIT_CHILD_CNT);
            END IF;
                
            O_RM_ADD_AMT := TO_CHAR(V_OVER_ADULT_AMT + V_OVER_CHILD_AMT);


            -- 예외적용
            IF V_EXPT_YN = '1' THEN
                
                O_DC_AMT        := TO_NUMBER(O_BASE_AMT)-TO_NUMBER(NVL(V_EXPT_AMT,'0'));
                    
                SELECT SUBSTR(DECODE(O_BASE_AMT, NULL, 0, 0, 0, TRUNC(TO_NUMBER(NVL(O_DC_AMT,'0')) / TO_NUMBER(O_BASE_AMT) * 100, 2)),1,6)
                  INTO O_DC_RATE 
                  FROM DUAL;
                    
                O_RM_AMT        := V_EXPT_AMT;      -- 적용금액(투숙사용-전망;비전망 구분에 따른요금)
                O_RM_ADD_AMT    := 0;      
                O_TOT_AMT       := TO_NUMBER(O_RM_AMT) + TO_NUMBER(O_PKG_ADD_AMT);
                    
            END IF;
            
            O_ORG_RM_AMT    := TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0'));
                
            O_TOT_NET_AMT   := SF_NET_AMT_CALC((TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
            O_TOT_SVC_AMT   := SF_SERVICE_AMT_CALC((TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
            O_TOT_VAT_AMT   := SF_VAT_AMT_CALC((TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
                 
            O_NET_AMT       := SF_NET_AMT_CALC(TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
            O_SVC_AMT       := SF_SERVICE_AMT_CALC(TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
            O_VAT_AMT       := SF_VAT_AMT_CALC(TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_RM_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0);
     
            O_RM_AMT        := NVL(O_NET_AMT,0) + NVL(O_SVC_AMT,0) + NVL(O_VAT_AMT,0);
                 
            O_PKG_ADD_AMT   := NVL(SF_NET_AMT_CALC(TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0),0)
                             + NVL(SF_SERVICE_AMT_CALC(TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0),0)
                             + NVL(SF_VAT_AMT_CALC(TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')), '20', P_NATION_CD, NVL(P_ZERO_TAX_RATE_YN,'0'), V_SVC_RATE, V_VAT_RATE, 0),0);
            
            O_TOT_AMT       := (TO_NUMBER(NVL(O_RM_AMT,'0'))+TO_NUMBER(NVL(O_PKG_ADD_AMT,'0')))*TO_NUMBER(NVL(P_RM_CNT,'1'));
                 
            O_RESULT := 0;
                
            PIPE ROW (TYPE_DC_MAIN (V_CI_YMD              ,    -- 체크인일자
                                P_RM_CNT                  ,    -- 객실수
                                O_RESULT_MEM_NO           ,    -- 실적우대번호
                                O_TOT_NET_AMT             ,    -- 공급가액
                                O_TOT_SVC_AMT             ,    -- 봉사료
                                O_TOT_VAT_AMT             ,    -- 부가세액
                                O_TOT_TAX_AMT             ,    -- 기금액
                                NVL(O_RM_ADD_AMT,0)       ,    -- 추가금액    
                                NVL(O_RM_AMT,0)           ,    -- 적용금액(투숙사용-전망,비전망 구분에 따른요금)    
                                NVL(O_VIEW_AMT,0)         ,    -- 전망금액
                                NVL(O_NON_VIEW_AMT,0)     ,    -- 비전망금액
                                NVL(O_TOT_AMT,0)          ,    -- 총금액
                                NVL(O_BASE_AMT,0)         ,    -- 적용금액의 기본요금(M0요금)  (20100224 AVG_TOT_AMT -> O_BASE_AMT 명칭변경)
                                NVL(O_ORG_RM_AMT,0)       ,    -- 원본객실료금액(RM_AMT의 영세 OR 면세 반영전 금액)
                                NVL(O_PKG_ADD_AMT,0)      ,    -- 패키지추가금액
                                O_DC_IND_CD               ,    -- 할인구분    
                                O_DC_RATE                 ,    -- 할인율
                                NVL(O_DC_AMT,0)           ,    -- 할인금액    
                                O_LONG_DC_RATE            ,    -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%)  
                                O_LONG_DC_RATE_NM         ,    -- 장기우대구분(0:없음 / 1:10% / 2:20% / 3:30%)  
                                O_MENU_CD                 ,    -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                                O_MENU_NM                 ,    -- GUEST_TYPE_ITEM2 (M0,M3,M5,..)   
                                O_MEM_IND                 ,    -- 고객구분(member_code) 
                                O_MEM_NM                  ,    -- 회원명
                                O_FAMILY_NM               ,    -- 가족명
                                O_PVL_IND_CD              ,    -- 우대구분
                                O_PVL_IND_NM              ,    -- 우대구분명
                                O_PVL_BGN_YMD             ,    -- 우대적용시작일자
                                O_PVL_END_YMD             ,    -- 우대종료일자
                                O_JUMIN_NO                ,    -- 주민등록번호/사업자등록번호
                                O_SALE_YN                 ,    -- 발권(판매)가능여부 (      사용안함?사업장도?       )  
                                O_USE_TOT_CNT             ,    -- 사용일수(남은일수) 
                                O_GUEST_KIND              ,    -- 고객유형(C0009) 
                                O_GUEST_KIND_NM           ,    -- 고객유형명(C0009) 
                                O_SEASON_CD               ,    -- 시즌코드
                                O_SEASON_NM               ,    -- 시즌코드명
                                O_CALC_IND_CD             ,    -- 정산구분(C0011-현지직불,후불,선납) 
                                O_CALC_IND_NM             ,    -- 정산구분(C0011-현지직불,후불,선납) 
                                O_MSG                     ,    -- 비고
                                O_ERR_CD                  ,    -- 에러코드
                                O_RATE_SEARCH_ALL         ,    -- 요금조회시 모든조건  20100224 
                                O_MEMBER_KIND             ,    -- 회원분류 101202 
                                O_SPECL_BNFT_GUEST_YN     ,    -- 특별혜택적용여부 101202 
                                O_LONG_SBSCRB_DC_AMT      ,    -- 장기가입우대서비스 정상요금  
                                O_MARKET_CD               ,
                                O_MARKET_NM               ,
                                V_INIT_ADULT_CNT          ,
                                V_INIT_CHILD_CNT          ,
                                O_ETC_01                  ,
                                O_ETC_02                  ,
                                O_ETC_03                  ,
                                O_ETC_04                  ,
                                O_ETC_05                  ,
                                O_RESULT                       -- TO-BE 에러처리코드          
                               )
                        );
                            
             V_CI_YMD := TO_CHAR(TO_DATE(V_CI_YMD,'YYYYMMDD') + 1,'YYYYMMDD');
                                           
        END LOOP;

        
    END IF;
    
--    PKG_RSVLOGRM.SP_INSERT('SF_DC_MAIN',' O_PVL_IND_CD '||O_PVL_IND_CD ,'TEST','TEST','TEST','Y');

    --PKG_RSLLOG.SP_INSERT('SF_DC_MAIN','종료');
    RETURN;
END;
      `
      this.code = sqlString
    }
  }
</script>

<style scoped>
  div.indexer_container {height: calc(100% - 60px);}
  div.object_container {width: 25%; height: 100%; float: left; border-right: 1px solid #ccc;}
  div.code_area {width: 50%; height: 100%; float: left; border-right: 1px solid #ccc;}
  div.indexes_container {width: 25%; height: 100%; float: left;}
</style>
