import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { LoadingSpinner } from '../../../../ui/LoadingSpinner'

import { Text } from '../../../../ui/Text'
import { colors } from '../../../../design/theme/colors'
import { CopyIcon } from '../../../../icons/CopyIcon'
import { CopiedIcon } from '../../../../icons/CopiedIcon'
import { SharePdfIcon } from '../../../../icons/SharePdfIcon'
import { ShareTextIcon } from '../../../../icons/ShareTextIcon'
import { parseTimeLabelToSeconds } from '../../../../utils/date/time'
import { useLocalAppData } from '../../../../storage/LocalAppDataProvider'
import { parseRichTextMarkdown, RichTextInlineSegment } from '../../utils/richTextFormatting'

type Props = {
  role: 'user' | 'assistant'
  text: string
  isLoading?: boolean
  onTranscriptMentionPress?: (seconds: number) => void
  exportTitle?: string
  onRequestPdfEdit?: (params: { text: string; title?: string; practiceSettings: PdfPracticeSettings }) => void
}

const pdfStartToken = '[[PDF_START]]'
const pdfEndToken = '[[PDF_END]]'
const minimumExportableCharacters = 40
let coachscribeFallbackLogoDataUrlCache: string | null | undefined
const coachscribeFallbackLogoPngDataUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAADVYSURBVHgBxX1rzGVndd6z9hywMWk9gx0IUYLHTZsLUNkOVZpKNNgtoVETJaY/IlRV4iJVqpSUsaU2bSq1nqESrdRKHqOqqvqDGDVto7TCJoJKLSm204ig/oBxLlIFBWYcSiDYeIzx3f5W995rPc9a7z7fGAye8QbPd84+e7+XdXnWs9b77nMML8JxEjcffQ6X3zxNB9fhwI67+fVwHJ0/Wv6DmcHdYfNrX97n3/hsfT3fAuO5+ZXPZyxew6f5z0Hcrn/cq/9s3225c753/mdsa71h/idfW56NYz1nw9jW/tcr1+7mhtc21xG2/5tNhmy+zkc/OYb4v7F/zTN79y6Ec/PHZ+c3Z+azZyY8fd9J3H0W3+Vh+A6PRamYXn7CD/zGeeQ3Htasr0JAvkbNJ0859WVIhfrQxnp/SqheD/aBlI6rWTZj7HG+1zWOMpwysdZn77/OXMAwq9kYKtir5ZVhcW060WBvbj2f7QzzTKs7M5847d+Fsl+wghfFTnj5iQPYiXkcRzlvi8F5STibT2tGXLT8W++lmJpziuaQYXr4mTcPs1BeXdJ80/fnZtLEhfpBDB/u8rjVQPjhIddzbDmNmFEhQL7g5C/QhsY2yM+a5UyT3Xlw8NSpF6roF6Tg9+EXb5tvuWW+66jLJW1oyBNeU4Ae86YiLP3N0bveuGSe9PJq6UWTjz4s+iAkD75MQa83LW4ikDdhpDqum6xczcOCAqLLYAYluGC8j3kvTGTrNaa1K5fxu8bGwVgaMmWX1racOvXP8Jun8G0e35aCT+Idxyf4XXOX1/V4Mv7l5LowGgYThwbx5Lty4LrX5OD5vsVlNe7NCStED/dmm1ZxknBpQ//QfCA3Hw7PW8UNBmNaJD9RqTYwBHTUHcfe5j700+cZhiYgiPfnDtxuOonfOItvcXxLBf9z/OI758tOz01fOXacgDgEJn6i94F1ORGjTPskthNMQrOBT+LqxgDS5KUwNjFan66nxt2bkgn2RJY+jiRE1toeFDsqgyY28q6NjDXffdyyJl7JaYs6FcUfmf959z/Fb96N5zmOPN+H78c7bpv/nJ77vcyy+8msD2Sd7ySuEcI1C+XbagHrHUintUl6jVby+vy7ElWz8pNoc/5nAo1kbiPPstPFICbLDy0VVvL06otmFv3nWESULO5f/YVzin5jTnrd51ptSzdWurZs063P2dDa4BgbjuXs4tYp/ZfTY9v2ivnFO/4a3oBP4I/uwwtV8Psj3p6UMqwGzkmkmFebXQWWY0w55YS8CSLMftI9cYGlDy2+lcpeQ09XjEtR5fipccVBk1ClxFU8JW3U2NIl1mvSYCZBoTSvGJHsIa/l/HPMuuawMahr9PmWU8QsZKAaX/QxUd9JQDiN1eDWTuzGt+L1+J8XULJdQLk3zx99GEN8bMQhz/GjOgq74t5kozoXYiQUhsiG2Hf40XPZvb6wnUVCa0FzJ3nbiTtZVuhqbMzGbnroGfhHZeV5LmamJsfhbRps8mp9Lu8OkHHdyFcZurYDW2981z/Bf/7Qtrc9Bf+LmVDNDX16bugYMoZOmKwXKg4ZbUYrE7z4mFv0+Om4gGE1CfUT2cqWpHQhK7zuK2HTjtrfyqmTGPXj3gxynwdUmLXqcxyL8SKB296Ex7EMx5ZwHTovOtH5+fobfnVDvHaH9HfPfOExE9lBeC+YxPNCInN24B1MiwnVLU6Ua56dBBT04E6bc/DpgxrHyKRTyXLYLsjxOn2aH1ojW4kgazWMsJLz5+BRRIuvbMyR46rV4fpY8iQOS7r3jEWjT3k29UvO1X8KJQZsfuU8/DnTwQ29iyEG/8uZVM1336yYk3mYZURZzk9SnWKM4vP6uagTX7fYFCIhq25xLOTLiMkW1n69SFHF0HZv2FS059v2wBZsO8781009LiSqKGTFv4FT5LiCIeTAGh/hGGp8oIxEsKxkR1SJUVac7jID1d1Iqa6xkmvM/fvehjfi4/jD+8qG8lig+YjZF+CDN2GoFnWnGOvFUBwSDDMGp4VhH52wV8lCM94V7qywtaGhtz77GLaFNGzGHRjkAk2z7rVW84Jh41jU1LeUBefUYnFNcR1f9m92uDxkb+v9LHbIZxnz1/YKYBI9l3seeRxPXDtXvM4vn0xsejcz5rS+VQTpCWSVCE+Q0aJZelzvtMLmH7remkU60xGiAzE9fZXtpcelbCbPMTjfZ599DFKEOy176n17Wr+nz3imfS7vRjJ6b+1404QPHljtNq/LK9xsf+4BigX9vifTCEPZJhEh7TbHmR4rRINQL9o9+kpccQua/HH77L3Pwb7YTCStdUiNxiOcbq/sknJ0G6p+w8fW2tiw0XY+LrdNn5voFsOU21Js89qTrL51XOO2GlRwCXVQSKH4zs/HWJh/c65sOWe4V6rcn+d2ziiZsq1FXQd+sIYuz2jPVTfhy6b/PPfwzp/4c7fOXrx68AGmGy2pzITyiMmwb61Fp9bhHdn73BbvCpuiJ4K5WxQ9JqFQtDPcn5OYsO8BnGAbR6JAetoCt7McJg9cGHhCClXeAHpCn9eq3FwTYZSWl6VnQnF/RRJofoEsSc7Cl+HDmH2DbNbkWYqCMMIjX7a0hKn6jLnwnDUECfkfeza9eJeWcqLjuKzPqaXuHlwTAlrBguPKV+vCUsox2lQk4oJaQmNaLVR3zJexvjsEVN4asS1Cp9KSKNwPKNB4qUFBl4OH4m9ELgEXYZLxDxJ2J7ocx0gUNMyqZo2cIDk/J80uK4Yb38dY1cfESXFN23vxq+Fo9rWDv2W943a867jbU1+YQncSOK0vDXh9fwAoNrh3SFgSciSsV09aKAcZU5rafPfS1hQNST5GF9Jk20qubAdcXKF2mZu45lCyGO6P3mo8E1qaYzn81SPyvrItzTEcRvsLckxhKjFya9RNzViLCN74qFEukhnSg9s8+71DBjpgdeoohpBzefxVswc/feNU1tNmlHQ/pYIVNoFaguudEnObHXp4QcwyPikbDRhFJtJjn+Y1ucmmZciDko12AEO1b30OTbnDnFB+O9lmzl7zcrduFYFWvf0MQdH5ge5bDYxzJT0R7IawovEpJ0iDoOIsS0owUaHKZpoEhCc2FIA8UzuKB1fcvJuHeV1nM5omUXUN8c1yVmUaIdWheOtFDpqnoMXMgvzJWPnqfjJMTIOZSqHynK6wQw7v0GhAT8eo9Wb9MtK6k6MRT0CDGZEyZ65FJ8sIlApx346R9yUJLAMIGXaZML4RkRLWmy6UKQzFFjRDnZd3ZwXj+ogzaU6oyXPZC01bfe5lF3trbiHeTD9i5Ws7T95KhFoh1gVnlo3CmfUl4GUcUvUpXZpwRhuS6ziauAze4mgL71YyS8jNiyoXQL+6mLW22VBFFK9Zw08HRg7RtYGCeckkBTAJAbNXpl+25Ao5nJKqyZtjCNfuZqEe57u+fr5IPRp3yhq0lxyJuyycpCx12xN/74hCcTmqIJ9xdzAkiRYKY8mpoEGW8KwXGRrSyFhLaZDX0MP3ijGZh1DhjuYm3ZcHyka+LGtIGiRjFQFsY+9gEPPMSgihrESU1igOs76dRmPJ6bqY+fxq8WC/piueLmErkNBjkAQGbbZm1pzBOOIUbllRvjDxP1v3SJbvCZ3KCgZMlLINYj/Nf0aOu3cQVLQQgjhRSqWYjTcQrIv+ZDznpQoX9NjmF9mh4r81eegaHsHoQIJfTB6t1yZPjttGhaIKBBNS6YvODFfurCLuOthJ4kpSleOIaJAd1FSRNB4dc/pMvEaSLXvGldXb6kbGn6aX9in1lJ9HXFaelNdNmRDTfulzVBONvyI/h242oLbDFOsy+sT7A3q+ZTqV41RmkSYzJT1335YkaVLmBb0KBkC3lGIonE7yH4pxcRRTqmrW+Xi2d2yXw83CQG8tLEnQllc5LQQMbM0kvQAQzvfLJCfDAP5Lk5OQJ4UClunc5N91mzezEpRFosG8hkbEAQ5kytW3hG3NUVCMgZI2AWnG/CHWi3XCWozMcDLWSgQdQkfRpB7OGN84lGJPtNq8lxEScsaSr4lvhGB3NkBU2Tgy9pLy+yhkCUMFilIrenxcldu8qnBe/ahQYrIJy0jUg1WqIt6EicjOc7LgymNidxkHylLA4kHXcwW/fkJ3JErNc2ka5u3sjy4spf6Z41evV1w2V4dffvSKjmj21PnH8dCZcy5m65AlmpXZ5wDUma/oknm3+Il3pAMaqu1K0PkBQ4fTXDVpjw4GLHERxjSAsMhsc9jHTQdviNXvlbSpTLPRXaylDOt2FTCsKMeOVet0bC/XDt+iEMl/rHy20ILCs7YFtsdvcxtE+T3Hr8L33/h6XH39NbMSX4Grrzu+nluU+nzHJ2/9dXz9zAMCYZbnUtKGMfkxjt9qKCAWkPVPctC6Zdf3FEcf40AolqLnKW6kQ6NOxkiJbKEJ5PpMxHeXY9jIa7q5tL5zXq0qtDqS3GXN0TfeHeBWWGQbHtI9A4Wj8nayb9pihtvErcUrj9/8Jhz/hTfhqlmpl82e+UKPz975v/AHp/97qIcrx1RuefPoCfK3VClQKRTaPDWdmPQuA35BLD2nWys5XnqW6ckCCsVZwoVG0gdJu2wKDNrCgYTR9JwPVrZA7/QGfyp7Ck0rg+CU1ms7ohaYC7bidOWg7TMx9ldd/zqblWo//M6fEux+p8ejZ7+G37v1P2bVqwKtD7Ly1IOQ3zr0w1G4Bk4ATbYh60V/u7wrvTQcdlKr0KclEO+xGKQlVTgtMEkJa4BFFxXkPAuTEIGB0KQCSrJW61yhaXMSSSgiJLICDhq2gZ4iiz4V9qOyh2tu/nH8xRM/Y6+98cfwYh0fu+n9eGaOv2aduwWDEi/wSo4Ceul/miHDtZyMMqdz0dp31nzRUOx0QmGGKjUJfWghDhiq+4wT5Z1i3E351oZn3WGYpiXeskBWijXiFDSO8HZanyfecLkwLsuS/jooQ+tzMKzljpcfewXeeOJn8IYTf8O+E/h9vuPTp+7CY2cfEp+BaWlyHcSkkJRUmGPuxt83uaz/0rTRYrTLQXZMHMqwCVMVcwnVHSJTbvQmtxYoCMms27FEl+POPUChXMEMcnDeSEIiVL71QgFUMrbquww08kuFjLQTMy63ZcZR8IxyiNff8jbccNvfwout2OX4yr3/B585+eFCN2e049xTwsqpyzdtI3egEUEkR7H6DCiRr+vBAwQMDaHIB7I0BsJGxvOl3uWjjyZ5qE0dDWr6AJZrqm8CwX7cLngag2c3jmVsBymUKdMEh1kjIukBRbazB/v+G38Uf/n2v4M51uJiHN88+yB+593/HpPiWcXSmHIMr+aTCyxk9K2tQN51XuiysUYSJa/59S7rH7QSyj33AZnYMXRTwXaMlgy5G0kyWYYU75QwXh5pYd7GjKya2ScWSst62Mj3e30Itby486rWJICXH3slfuL2v40//86/iot5nJmh+fGzD65D6CtzE8phrMNuLtgoc0HZ9so5yCpqsnF9nphScku7uymT97zXsuVkby5BmVV5AxU0q0PRLcG0aiiV+zY4KMe2DJAJXwBjjwyrkT4Jx8Q3LS04J6X5RlRIgjaE/vl43ZzqvPnX/u5agLiYx6Lcz3/od2MaGFCShD8QB0X8tLIyOIBZW+WSLWvBgStsMcdVOstnO7Jm1FoLqYcGJOYMfljxOs3PejCd0p+9UCA/HWpAlW6BMccrb9Dgi7eh5TKm6AOwPh4ykyKdsXdFmMyFLpu99rrb3o7Xn3gbLvaxQPP9J+8WqWJsTbmaZMuP0jinAa5jmvHXtOnCvRIZpGS7GzHW76YQQapJZoVyWEBd9XiMpjTPRzxSGxDTHfQlFCBMDaYYV2DYQ+MVN3lG26tQsVqfuVXb+exgZARhSK+aCxM33nVirjR9d7nst3M8PadCH7/p/csqnJKAHjfWl6Z5QgWWBCB7vsbbUmimdD6ifQbOefJzmnSQlj4GdNKTjM/ZSmfkIUJndIvUqrQoBZggVRYjWCWTPqxf2VoLpntIq6MqY47K0U1t/siJn14992JDMo/7l5To3INggEuF9K9tyXFnoJHX1iIhr0sXHYoZcT6oZLKTNbLxyRO2tYOWtiYbMmjflySlzfq1Vf3Hio0pRKd/FyhMNcrKV1G+Kq82eqOKJHH0eAsTd8jR5fVt5Sol8pdmIvWjlwCSeXzhzt/FZ0//DwaW8Ugl5+IrehUteUXZMyr+BvJ5+Y44ybCSxE5UAN1Ngmev8nx61tq2SMvaBKB4nCGbaxmqCvGDynun1GhstkNVGfToUy/wN+guKFPunxMQ2hHP2iBlKy87dgXe8uH34jVzGnSpjsfmuPsH77vLG1HR2Ln0mvUgKBmOOQyJwDTsNMl5pfqTLRGG63P5grq1XeB1BX8ouFvla7IpIItqZQswbaKGGkfFCQhAwOb7is1IJkrZbCpWoElMRrKGYFmS2/IRrXxZ0XnrPb+KV16CeNuP33n7B/DYFx/KKpWVx6LSnnVq+a84isCTojUuszZjphOQlCUGWvKuFSWL3iyy2CHBf8JI3IbQKKZLz0vSau06FjGF/o1TePnYoHxnHC++AecyxLjiB04wBpQgENwBnazM5xYS9dfv+ceXXLl/eOpunD/zgOaoD3Iaidmu5S2RxeK9dKzJivBo/ikfIdwQkpvj5GfL313E6Amo2pggTosCaiBcfX0X+4FRHlw39/cGePP/BrecfBUsZBrekkDGHkVqoDHNYgHZ8bHrXoc33/XeS67cP51LkX906m43EZKaL2NoSPSgiCfQaasWRZHzZtuFcNVfW6LwTapUm/3WQkcraOSd6ivFXAjusjNjEdLSFvUgRYcUa8HZW5y0hghGYxJHz8lvSh3MjwYDYd0ljkW5N82e+7JLxJSXY/HYh+f/ZuWmMVpZ3TJCb2u3xN1exAAEeNZZxHqMqYKRgSutIh+yxlCBWolbIHpT60yYaP+EPoXVRFMyhbzSMhjW/Ly1pWp4xXXDACnLP3rgWgHbrHido8N5WK626PjRec32xnv+0UVV7kKgFk/9xv1/7LNS7eEz52LpryFe4a0Ek5ucKQEn4rnsszI6RAVfttCIljWUTTmxXxp9kOMwmoTeXA92F4dKBQ7JWgwHxPX2VE5+plgf13SiBN03NpnxJkK5u6yc7WXrspScjUhEK2ocvf6ai6bcM7f+p9VLz5/5Yzx7/jHvBaFUXsyQXkmP0jxH/xH+OQvkeS7bS1mKo0TjaGXI9QOBZ4a06tNLJ8uHuxBid6wWJ2ubbMVixdhenKiUiBfpKYW6V8schOdszkd2uZmE56aMYvQlsfm+o9f/AC6m5/7J3Z/2tWCxCntSLkoFDCGDRKphq1c5QVqB1zyXk33tncKUbEDPxNYIAOWb2RdKf4V6KKFNhtrvaflUfbbJdijo8CF4K8Ct96uN7NtIotK2dH9T5dLZxM/1H8dk8cyyYWxn/u/Y9T84K/fixtxX3/hj4DcX9JiXMhDkrfPy5Aoehjl8hjVdwjjHWFVjU9x3Z2g7TdMhzOvZ49QRZGT5b8qJJH0tLO3axYMnyYoKj8QFGDfK2WSRypIYulv9pDNGdC/UXLhYqzQIJA9e7h42e+W8dvtTFznmLsfcT+MfHH/Ji8XzGLUZOha6j6GpmmBBpy0cQYr1vs85X+Q/NqE0OOz5yV4I0PSr3PgOI5zzqugc3b4qX61mcsBWcQRt8BkvJ5UeN1BuCVxsJIClPq8pWnuHK6692v/KXX/fLgVbPjoz80YwUIEzuWDjPenRqkiN0qGnDAhOACWDtnaS4gizRqVEe86RfpfFjwyjMebY+K6RmJQqxQD1uaKniySVKIQM1uInBPk5DinZMBKQ3HggfUuaLc7NV19xzdV48yd+xa64RHnulXMYiN0iUCIwkkjOtYovlMXUIK5Cq4/zbmjFdFQ00qvkGJfa6GAF5chv4wGseSTimQfRFmvxZWJ8qWGHFUXEtDjgjA/L3ylxQDFq+M+94k1YLON1xI+wi4ltWsVhzmhV7j2/gisuYRFjQYkrrrlqXVTlmMngudEh5leiVzzU+8mSBdsgm1Upk1F+sfAT6SK/HYh2lbF45ComZmL5ZWv8S8dKklWClbtmQ0GanMpPYA8nJhSLDK1/XWjlNIdod7LEiMz1kFOa+3B6qmFosxGz5UmBS61cHlfPixWGgYBqx5AMcn59RIYZdGlKIspYrK90yntIYoE05vRVyxYkA7ZZRsRtVqusJxHeUOyRfL0aioUlpgLpibTMBt+ov2mHdkSTEwKAmJpOnww8mNm6vLgOzKp14npaLv8HtpVGcsOvvfslUe5yHL3hmkiSyuCMc85vAyIGmowg1JLzKloT9+fsh+zFZUTyblPV35t+UqkrPJP1DIiRduLrYkM9amJQvpqUqfjgOjytCDWSkDE3bzN3QgQasTrw/lBY5nE9hnuVIDk5Eff5eMPt78D33fzjeKmOx7/4YFafyuP0ThkEMwzmE8wIUrC1kaEfSWYKEphFeBoRt4fSxbwbEVgcStKUmisy61HoYP5cA++EyNSyPpFiODwOt5EHsWZvZIN7F9gJ/1oxdGPqEJ//hZO/gGtP/DRequOrd38GZ09/HFbTr/kPR6vWGQ65ppSb066UhZFc1UdoL/pQ+MlMMj8AhajffVAXLoq7Y0ddNRAHxh6TzisrW2V3sdlYZ31TtpOHdlrIBBBaM4W3eR+fFfvDt/08XqrjiWXT3Hs+SPjBYNyg4JZXq3zLeMsZ8jIhFnruqgbc22uULZioN+vw5VC5wZ9SR8s2Cgliwb9jakKuXEusN6fkCaA6VRPMOec23InAgD7pJBOCL5geMnP+M61K/rPX/SBeP0PzS3Usyv3UTf8Kz62LCcwxUy1h4iny+Ls8+6/twxmKKOxFBs1RqIDSrFqlFSBdypOeMLXKGB5t9m/DjT7A2GqqnuzYmsDYteEJY2Cs2EkwEgVz2bdKazQQPZ4KLzfYS9aVIa63vnIuZLzprl82vETHs7NS//dN/xpPzkq2tG+XgGO8oTR6lZzEFCVd1SbCrekcAqmac3R8cFC3LSSGP8JLXnRYkloXS+gFmN3ArRKG+YI7FXsBRdAKM99UmKw4Qc6RTJlrX63NvM9lpWGBu2NX4Cc+8Q/tFS8RY16O/3vqt/Dkua/5VCC2nC7JcolbS53yDCt0tcZSKeEuY9pLvO9I1ypnqbRcVpWzsAYcuzjUkZsKYtTTrrOuVncmoIo9DofgNgdLEqgBhF1mxFmgxANS6ijLyHwu23jjB9+Nl1K5n5+V+8Adv+1R6jPt9Z4a+aOJDkbaNzowKK6vGy+i0lL7IemYeH+kpfy27q/9z3Td3NTvKkWv92aBSnRtl08PpG2JusW/betMTSw68sGiy2C588JbQcDk+EJxHSYwh/3QyZ/Ha26+AS/Vce6O38YXTv6Wk4e0rSOBtCjDhZAPZaDtcO/kJoHY87EU5wY5Kte9Lz3SQaDFfh3hJA05U/HyTeIHsoy5k8LowXkDKhOlEdeD4dQ2KpZqFyAqYS/DsVzUZRyiE6g9f92Jt9oPvYSM+dF5Qf9zt/wGzXM9xyocBWflnp7IVNcK85jxZbx23RP8hNkGgxxLjGBOGiNg7Ie2KokEQ9jO/VjZhfW/cfjO0CK9gmRdQsXX3FJZENf3ZG2gIcQ8GZeawyZBa2tkqyQuu+Zq+5GXkDEvZOr33/5vK3pyMSHdsI/Va4JJhugX3rYqeT4LxUC73gGuIpRT1k7I5d3U5ElhrpHXBz4FJTEKGfIXjtDY5o7GwWTZ2wpGWO00BAfiPRlkDBK1icwyYjHICMW3MTsaW5T7pnv+AS7VsSjzmfNP4NH7H5hToCfndOhrePDuM3jq3IM1c2/8tqetyWxtEy+5wyXepzoFo2K4JltozCr2qua3TrLf0m+FRgPbqb60p623V8UkYyULQl2pUzM0bzSSRhWvE8L70pmGR6YvQWWMsGEicxvX3fVLdvlFJFVfufOT+NOPnMFjZx7wJ889RBYqDZXhpRc19GJUpOWq2ucYQh7hElnc4RYc7W0mhfKUV6p1NZ6EXW51tVBb9A+FBh/cA8VkugGsL1rIXtraTdE46ukEs/4AMVqcBVo3RbptwwCpcWXbsVHQ0AL3esnxkz9n3zOvt17MY1Yqvj4rmNCEATYrg9BOCb5nzilNNqkDqLwxheAb7EW7uvEWI5Ppz143IuYZ3gj7RD/GbJZ+nWkvOopkcG5Kjq/0b7lZ9zQpVrpxwmulDwPhiKv1fVjCAh+EuVr5PNg5Heq2c1GOy6+5Ksa5DzWaGifYdp5UnYKgR+cVGXX08gLfR3OrUfdNAYAPTxaKTAH0UHo/rZBsLaoJIX76rQvG0d6vRuOWATJu3g0T1nMvZU0xfC5ulPFLMOq9wQQaH/fC8fG821NnH8LFPi4/fhUJok3DYzA9pkHsd3iMVl4TEw0jmES1suRqpQooAq6PcmpNhyHJW5+J2MPjJhyXiZDSI4cnC2EDFENwnYaWxcjlxp20teJ39WNtzGgDKMw37adqaXAPFmllBznU2tFMgT15SRR8NZqxWZ9vMtJUpqKaMe55Fm/aXrI0e68dlIyA3mK53NQKykFvMaEhWr+VBkEelWMe2/Fxfv22HD2Vsra9q++B1iDSc63cHSAAs/rY9ktzMkUprJ58lTXy15Yp5GXQB+efKI5zkY7Fg6ceYNLCwxr5TDS6AKpMjOYriqFgWjhAvq5rzQ38hOiowmLbO86LdWMjaGRDZR8+XO6mkEhk5nCXI3+CxxjsQZJlOdfI6dhx2Ae/GY5VqPxSQo944U2JteRdv0HI/9xnZotLcaws3UIQ9Xu8AXuGzZ7sFK41j14Frp1mpBWW23VM32rTp2esHmQaE9tnivAyWsdra7Iy6QOt/MkxVif5vyzuS879M2TpcploNKAlARs7cn42bKib0ge46ZugzC9PmbwEZPmYB7flLIOf89CL6r08dkevsHHd0khSrATdxKLCA/c2Qca7KsqbQShgmVm7Z11TzYfom/GsZG9UQsg8f8U8ftgrk+8Jrj1pS+PLOKJUGfGV46EBsehSyl6NihOybk3ZqNdOSuO+H27Qs8HCDFQgG3YncK8Cagk5BXEwL8stS3MX+7j8+KtWS568oVV/3Y2W86CXItds0gig53xJSE0C7QsSVLo8L2VM+O1oFhvrvK0JqMhktXNz4v2Dl9IQpIdESm7w2+m5GOs5N8ONdQ/LdQsrWhhnyZ6FX6r4AOklLRHLagH55XPnn7DdRdzAvjD1R+/9XAY761nbBY5iEy0zrgJIKrWHzDgf92b7rbBjLf+GagCm1zksjsmL9TB7mYZ433Rim355OtJlk8NN4uzgjkHF2NpJGGyaEMeYMtHyUNdOVrDBUfXnnji2pYXHz3wJF/P40qmPrrsypvLcwXusx1+DECtzmCEcmebj6XVbXiEYRks30X+dlF46NTInyLeE634tTH8nqTM92AXDBeWIKzjeneCEzHhtmIk0KzC8it7nzU75PZG5w5N8FTFKknbrBt8A4NlHLh5EPzzXmB+cS5XMD5GwWy4sW0NS/eHS+LDCCi+j53FLMFTezQSZbt+RkfDu1GHiAG0r5Q26LwjIXl1GyKgrsgRplc3n2Kswo013MRcfVn8yP2iwJoVGt2Tnc898MqEihLPo48k3MksZseTpsw8ZLtLxwK3/pZSbESt/9UNK7ZWJPKXrM0XRa9PrsIRSHiruqhG9bL/gYhQmlV5zr6AwcBWvjITnVEyI+yIC2hB2RBd8xxKjjV92QuZsTLCoJ1lvDS75x2gcBJzZt03Q1qyfg7tY1awvz9D89LmH9E2cUBGp4lUWXwaiQc9o8bHFbBv/0j68r5ZRYrzU+bXKKdX1Jz6H+n31q7JKtc/PnUuQJHX8lcMy4eFIh9yhGYcNSrICXJIFWW+Th6p6ZfoSTgjUO9oXC4wi0sFFYNGL0Xz55EcTB00b9iUULyloLpSS10dpoLXQs4FPUSH0D0NuB4xStXKWtxVSmA39xSjc2+gg0tYWaPMMw2eD1poKyyM2liqRUV6W27YEdxsxoj2hWgM37BvBigJTY4wa1Pz3yfu/VMb/Ih1/cupjPWZaeVzibApTQOqoUJc3JSg1FpJ/wmYSzbzF6/qOLqZXyPadyot/tUcDvf5U/CgTpbWtymhcyU7ZJSeQ10PtxvVJshhmPMY/wIahGDrNRX69teSSonCDgsqey5DUxXMPP/GiKvehO38PX//QJ4fYq7GQZihGdekNNil7NnTFj4gqo7CEhVR6mQX3xzRXzZW41eDJbVFPkYi70GFqKcJKdq6MeUCc/H6BsLm4qVaT3Mqc+40Qc6gRwawMcrnV+URN3kGoN733LHOW3OOag0eeWNOYIy9SLvzVUx/NH3JuGnZvErGRnOYkrAcjKJcfdGONLI3e3zzfDW1ZsP7xrR3H1zqmh5jiba1k9Z/Xy/6J4GYdUPPTzG5UeFnHsOPA6dbYwGXUydkEB9uIRMFzNN0wKS/fT+xzIsufV1z3A8+r3Jll45tzoeK51RAeW+PrcuNc5lwrYcvny2CWv7BK6PhXokkhM24CaFt8LT7yYh01lwNRbaHQKpOD3FqLkZxmulm7xuufpQk976WY2+Q/yojrieieS1usbyRSB7U3v52Pb9lZL514HeTma2tlwlQWB2v6097nnWqAOym6u8j8DNfe9ffwfMr9/E23U4lNda4cDKjmisik6BjiqsmeBZRr+Mh3TN+tV4YsV9aMZdfDjzZXpGo2RtDsl3hHGPRrq3WGkKwzWGEBldoNq+0Di4aXx3tzX/RkbfO1hFRhm15ZEF0+gLZJsu6buid7Rzn1b68++bN4+bycd6Hjy7f+VzwzpzrLtcvD1QeACNo0ug4UVJXPelOzqEhOx53zSasd22nGmcqqQYOkxArJrDmrlAVtDyLFQQWOXsqsCTcoztisiDtZz+PzSm3ybdburaElTaodhFb213Z26Ogm3t+bDfDTYkjzU7MylLj3Zddche89cRMudHx1ZsKPfuR+tHy7nowQTNJvsmF5jctLAQUsG3tI+ur1Jdo2PqOT9KtkEo+OePuNQKv8v29eR27egJexcABe1mJWRuJdWk55hhFP1r51rDYZ+CBddRjfn8AnIXYdztIN0tubDmlz1ibsZPNxgTmJCUZvUO5G6mIrSXnNyZ+7YOz9xt3342tLqtOxtV/Q51fI39K7xtgZWztVzvd9NUyxs/qgaAbwsa2doDBJEndnPV6IWPJU0YdyCQoggIwW0vHc0OATBfYtklohJpSDh/EcNBZtHZKRP0ku60jB9LjkrYDR/KWBD5T3FkIsl1z5rp/EsXf+JA47lnj7/97zHwpyaRjpU5xfvpb8tT/YfUCptj+5BiCuYE0rhXBWwB7xsRwg72UIryyGzwpxro2uBsFkL6xHcxxybmtKV0/tr8n7lUoNsnVKKPpLm9hBOjUIo52Q4X2FAkCvL6O+HYZLXIzA1rTgFFoRo9fc9rM47FjSpXM3nYY//ATHSokBQ84ZcvMWM6ayb9co+uHDA16mPWKl3G4ACn4Nfuo0/8kyZMRIuRdNL85DpGWN3fSyFC8b5dw40yp9CplCY0t7B2VMgvfGk0p28ye7Se7g9DJ4Myz1CA1b5bcyLYD8PiRvmqnq0Dmb773tb+JlFyBWX37Pr+OZtTbdxU7ha+bqMj6mITUyY/tpmbexjqEj56GYu249FWOpNKWJnG6dH1tafv58njlliWZAPWzo40rPowsTELa+q7oY+hSOq6jCeYMgkPf7EoNzJipihCE1LHetW66BP0cWVxQmMC1KNUcc6n44t3HZtTOxuoD3Pnjqv+Gxu85UClB6A6jyQkQZjyARfNLO0TulQq2nR9lO/V5FhaEMDSrU+IBgGDDU5K+ldN2bQGZo8dfLRCDIC3n1Jyro9AKvllmx3zSIekICoXsTYsYNuzihH280Qg8bB+GAEJXXD8UPiAwkMrQ0NaFoGdTVF1DuIx/6FB46+TEYWlEuYYrMObzTlAY3du0pxXxwT3QhhRFfCRHCoOLCcN3b7ywNQCQPdmIE3a39JoKuT9Fn3mpqqD1sphsoLynN69kuAoX19tEsXnHHRb54ampzpsCWOfb14JJXIxZDV7JKL2PU4MpbUNFY3xuxEKsrG7E6OP8EHr7jE/j6HffOMfdxhgwUz0PRHFaGHHpWvvpqltY9pAlKk2Gt16W1SmEJQ0NzRgiGqnFKXgS5zC4ki1qVs6E+hkaahkdmXKxNcq0HubmO66U4fn8d2m8Lh3FLHoT3dblwIrRQMp7sUaAAoKh6V2Q4E/pjKWXxEVFmqJ7Toavm2Lso9Zt3/z4e/dCn/LF7P1tek8YTlpg5wzB5R4l971WtowC9xYQSl4XTPdluPSYCekf32NJbK0zQdiTh+OucDKFT8Z+WItPJ8Sn7SACIj9cvlztIfQbndv2mcgYTun/uXYgtvfQMB+sR4Z9Rqky4wkY4UEc1qXqUg0IV6OhH20sfYcmXz/XmR2ZP/cYMxXP9OJa10dS2dlB4rt9WolWW6AaVDkX+BmxSeMhMnwcvgHB67St9LKxXEEK/VvmTI4z+lZ2BhsXqtcYzwL9uQ+MH3tStsJR2heIV+VnNei18uB9YBiCXwZHfNUJnn8MvSQwlwa5wiki0hieHYOQYD/YQsTOcR4vgm/brnm2/7q0h2+sjx1ppXfdrGfoQM/c/bzLPbcJyanTIpzNDM25u6vRU3WeVY+Xa8UgQbWtKADZQ7k3Mg6Cz7ZUTWPjqtm3Ofdk2+/D88phKLmDMC7EqJih8DPMbYtagGG9QltdPmTF2iduAktaKcoQoXla+GCdyFkNRH+QiVchr54OUqJqogauu7Rs50gsKnYcg0c29FLS0cVDKzJ5iC3phNppim7FZC+7M7GLu3gyHD9jLQMiuc6ySbzwp+YhBm70bsYlR92lkrai2zObgp7y3HgExTZpfyS+RuHttr1UK1lFEEzKYvsXWgt97bRr39oQAqiDjbR4JsXKHNKA0K31FMIsgo5Eitw0batvrIMj6HDKEkLuubz9xEATFGXYlr9RExFm27apdNL3kD0Mn60IUPczaGFJ4k/EriaezS7g7E6zOMC42l3DicYvEIGphUIDyM2NhQ4oePJzzpqdMLT7lfaZWUimuxzLCgFmSTIZrHEczLi+PXwVh9f3LJTQro8t7aq83vN0Pcg099bBVdM4cDqv900YE0FimLq30zkUB9WiMjCWcw+v9FDNP+Qqy02A9FZtzJ4DDzy6VrLMmyk76bywalQJykkkO5BTCTC+UsqZSSIxhuk7iL+ZvlGG7p4G7V2umzbcMbkMfNrXhEaoLH7oH+iGBOfvxij7b8TtRQWlQMW+N3/tP//Apwax7eMqHoTvHbWjxvsvNQsnkjLXHFZDLtZSrcjo2ameWGHymdlzQaxJjUfJuQDoMrA82SRGY3zFCFEuoOoU10cWZ7C4FZZng8Ienx18+k/v13DneQ1GuWSGgk7pqI8x2mV4PqY64s8U33ouM0zK8fvPKzJrCzVrMH4ygyQ2mgRs6SRj1MMwJChWp9Dbu9c/Bmd0BXvaRI/YM082i10ofXI13Scl8vX9flCmtytGkMBMxEvOtEYnMU9s6J63U9OUUa2lBmhTkeRXoQGzpQhoVl7DFIit8vKyEas34NgZMFcsKDaLBLMbkZhprLDket9WdRhvQtwn4FsUOCON7Rlbrz+jhj/Ry2GhxgOfuW1t+AL98z3zVjd0yZAlDOlNA0txhpKR7jVDAq2aL+TX2PELWfjPrxZnVDy7Jkpu8lxCdAzRTBuk9Z25C6OM4dCzbiUgGW2gYcGMcgjsOb28zlv5ZGXS/1LXxSrBchtTvX7jVNfg3N7DMfC+9giTAknSJcKQALW8XIcjA335bIP+L/60PVtUuBFW6JuTzrlzt4vVA/QgUkuDlfMcHtgO2LadcW2DVDvPvlAdxIX4jQkRoYKtW18JELi3tsebGB+2szRXDdROYU4/31b3xpAKv6yQxYbf6IBg2wtbJWoy9/SDCfOIIptNIOeNZ7O6YT583WDXg/Ovt/R5r7uvFVkwwiEg9a+veryXdT5vMFr3tiGRPaNW0MriwqujD8pdKgkWWMS7/NiXr6bupYA0yIM/fPpGBrMHJyzDcm4KyDxuVZmloZk0erT2eRb/bgcqXrR4Oh5xsdDBrz2bzAfFsmYl03n8ET98nBV+L0+fn8Z0erXFjdVZbz+iBe9dV/ldP9zev5X9ApTialJl1FEgct73+uxVzWW71YHd+qH5sf1xKNGS0jKFBhlKQa323HjnNp+/zM85BT+CvGrL8eov+GK28cr32yKBAtiukanOrJ/ujeetlPCs5ZrLnbT6rLHDna/HvzkrBy/H06sU4b3aQyTOyhL1RTnEnWKmwWTmfYy3ys1USYdjSk8fJNAG0cTRlC5LVn8fna94YQvYpx5E/OdPHb92IB+OjkhRMXX0g8sssUKTAo3pQCoUSN7OtMvLHb4b5sX/bg/xCKm/eTBQ0QxWdmjEZDeyZU9SrFLx48SyXO0zVHkQzxtUJVOzMrSpGRbXYRxo9mZSo5B9oELV+Pkw4YVw+ztfGL4GZLL/IACa44lAphIxBcQc9wsf+02t9Y0xSUvUR62pDEaXAYVR+e6//Za8hC29oWEAdXwyzdQJrhpfjdc8wQCNWCbC8N5jJKXqvBtuPr+C9n5n/XB8fMo81XVfbUb71MVyrXQDwtgrkZeyNgbZCQoBosdGKcJsFC7UYgvRSiMbCb7vr045mx3Poq1VsLPuonbU1Nq0Ql7zz8mHJiIBQ1/S2uwz2zm/mW9ooWa56wtnX4gPX9vt22BzzcN8+4eAzc/tHIbpSHV5ItfsJgoPfGuOMwyqlOxcXB0lrUm3pUu7IYKGMpEonGX7zDsMwZhvuNVEa5sPqB2pjWJnpbSSVseEeU9jKD7od7u8wsbbytUmPbLO2n/OIb09QpZDjzIWb4hAzAj99EzbHtD3xWpw+ewC/teACA4QUFKIzV9+QropTUMWrxTiL9IbXC/ILrjgZQRuhCSuB8/ZFKT5CI+/LduucNygzq/XuzgHQ69BTb2sV4iaGOlSfTrNRebLCFqGX2vQYs+ZViyjAyA8sFx1I9lpfyTmUqfizOHh3h2Y0GR56fBXvPTlP8LbwLC/E80hPWJOsZvISbQjIKW8duxmhbYoM48UG7VJynYgXCVe9UoIUiOtaNiNPGfGPfTfksLbOqmuok7zPdZ3tow9rxRu4Xq4/8Ibdg8w09TzZw1aNWUKgH3sPgX7ye/GBUzjkuKCCl+MhvPe2uYmTFafEjqP5LJ2FKjt+atxNqCmA9GoCt3txosOAPj/1XKrYs5aYhDVZjPF7e2X2ThVYPz8eg6A37VJ5vKbObYzfNVcQgt3KuhpF3Fv/6JxELTlljgxOs+G8b1buSVzgeF4FL8eDuOXmOSZ/cO78WFk9LbULI0WHZKi2fo+50e5JrrYLQoOMElLpO9xzJn/ncL2MI3rNEOeHiEcAxAl3oalzp3agCjug2m/drcKgYrHtBd3Ruwdps1RrjYl1otS13I22gWi9feQ52K2vxuk78TzHt1TwcjyMW47Pcfme+eLjPnbtidpo1n3IpBrk0Gto/yNUjfcdJqi8nP2T/XQ2KbKEmmAZRFNO2YXtY4gLrUZvbzPwC/ZXCzEZSGvZPr59N+/bG/PQTg8RCRg5j/ufwlNvPyzmHiaub/t4CLdEXG6jGSZ1SHs1WGqGjkj49tr0tr2VWNGH24rwY9s8kTIhppD4kjukIRIaD1t0SLxwXAgVnvfYgyUMiD5eN3y+v8oxznc+zs/rTHdchdMn8W0eL0jByxHefHDyCOydBE54zb0EB/TVo4q343HYlLmA3ZlHBGMnr9jbhGdIPPd2QXWxH/foPxdAiUHYjePEv1Zht7XIwYlUbZSq+RS2txNVJyheIsNYilDz4sF0x7G5IIUXcLxgBfNYFD0r+S0zdN8yj+D6Ft0wxGgxU1ixZmGS0LExwo6YFStNKqnYXLewhCJ8HZrbxMemrTSc5dKDJDCCcsGkYqZi5NDpPhnDmPtuBsNO0e9hu704NF937/zfffPL0y9UsV183/VBZc+Du2H+77p5gMfn0R4nIekCSFvXOUqoCgF8JmoDmRzwoUjmm0VwlwxLyIprQpdK55pK3IboWYFvH30KdrdK5iC9/HiYSz0JlucWD50VaGfmE+cOgDPz6bu/U6X24/8D0uryTDYKzJYAAAAASUVORK5CYII='

function extractExportableText(text: string) {
  const rawText = String(text || '')
  const startIndex = rawText.indexOf(pdfStartToken)
  const endIndex = rawText.indexOf(pdfEndToken)
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null
  }
  const contentStart = startIndex + pdfStartToken.length
  return rawText.slice(contentStart, endIndex).trim()
}

function removeExportMarkers(text: string) {
  return String(text || '').replace(pdfStartToken, '').replace(pdfEndToken, '').trim()
}

function resolveExportableMessageText(text: string) {
  const explicitExportText = extractExportableText(text)
  if (explicitExportText && explicitExportText.trim().length >= minimumExportableCharacters) {
    return explicitExportText.trim()
  }
  const cleanedText = removeExportMarkers(text)
  if (cleanedText.length < minimumExportableCharacters) return null
  return cleanedText
}

function shouldOfferExportActions(text: string) {
  const normalizedText = String(text || '').trim().toLowerCase()
  if (!normalizedText) return false

  const genericReplies = [
    'kan ik u van dienst zijn',
    'kan ik je van dienst zijn',
    'waarmee kan ik u helpen',
    'waarmee kan ik je helpen',
    'laat het me weten',
    'laat het gerust weten',
  ]
  if (genericReplies.some((phrase) => normalizedText.includes(phrase))) return false

  const lines = parseRichTextMarkdown(text || '')
  const hasStructuredContent = lines.some((line) => line.kind === 'headingTwo' || line.kind === 'headingThree' || line.kind === 'bullet' || line.kind === 'numbered')
  const sentenceCount = String(text || '')
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length
  const characterCount = normalizedText.length

  if (hasStructuredContent) return characterCount >= 45
  if (characterCount >= 120) return true
  return characterCount >= 60 && sentenceCount >= 2
}

type MentionToken = {
  kind: 'text' | 'mention'
  text: string
  timeLabel?: string
}

type DocumentSegment = {
  text: string
  isBold: boolean
}

type DocumentLine = {
  kind: 'headingTwo' | 'headingThree' | 'bullet' | 'numbered' | 'quote' | 'divider' | 'paragraph' | 'empty'
  number?: number
  segments: DocumentSegment[]
}

type PdfPracticeSettings = {
  practiceName: string
  website: string
  tintColor: string
  logoDataUrl: string | null
}

type RgbColor = {
  r: number
  g: number
  b: number
}

function normalizePdfHexColor(value: string) {
  const trimmed = String(value || '').trim().toUpperCase()
  if (!/^#[0-9A-F]{6}$/.test(trimmed)) return '#BE0165'
  return trimmed
}

function hexToRgbColor(value: string): RgbColor {
  const normalized = normalizePdfHexColor(value).slice(1)
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function getPdfImageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' | null {
  if (dataUrl.startsWith('data:image/png')) return 'PNG'
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG'
  return null
}

async function getDataUrlImageDimensions(dataUrl: string): Promise<{ width: number; height: number } | null> {
  if (typeof window === 'undefined') return null
  return new Promise((resolve) => {
    const image = new window.Image()
    image.onload = () => resolve({ width: image.naturalWidth || image.width || 1, height: image.naturalHeight || image.height || 1 })
    image.onerror = () => resolve(null)
    image.src = dataUrl
  })
}

async function rasterizeImageToPngDataUrl(source: string, minOutputWidth = 0, minOutputHeight = 0): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const src = String(source || '').trim()
  if (!src) return null
  return new Promise((resolve) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const width = image.naturalWidth || image.width || 0
      const height = image.naturalHeight || image.height || 0
      if (width <= 0 || height <= 0) {
        resolve(null)
        return
      }
      const scale = Math.max(1, minOutputWidth > 0 ? minOutputWidth / width : 1, minOutputHeight > 0 ? minOutputHeight / height : 1)
      const outputWidth = Math.max(1, Math.round(width * scale))
      const outputHeight = Math.max(1, Math.round(height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = outputWidth
      canvas.height = outputHeight
      const context = canvas.getContext('2d')
      if (!context) {
        resolve(null)
        return
      }
      context.drawImage(image, 0, 0, outputWidth, outputHeight)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => resolve(null)
    image.src = src
  })
}

async function getCoachscribeFallbackLogoDataUrl() {
  if (coachscribeFallbackLogoDataUrlCache !== undefined) return coachscribeFallbackLogoDataUrlCache
  coachscribeFallbackLogoDataUrlCache = coachscribeFallbackLogoPngDataUrl
  return coachscribeFallbackLogoDataUrlCache
}

function buildMentionTokens(text: string): MentionToken[] {
  const tokens: MentionToken[] = []
  const mentionPattern =
    /\[\[\s*(?:timestamp|time|bron|source)\s*=\s*([0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?(?:[.,][0-9]+)?)\s*(?:\|\s*([^\]]+?)\s*)?\]\]|\[([0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?(?:[.,][0-9]+)?)\]/gi
  let lastIndex = 0
  let match = mentionPattern.exec(text)
  while (match) {
    const start = match.index
    if (start > lastIndex) {
      tokens.push({ kind: 'text', text: text.slice(lastIndex, start) })
    }
    const timeLabel = String(match[1] || match[3] || '').trim()
    const label = String(match[2] || '').trim()
    tokens.push({ kind: 'mention', text: label || timeLabel, timeLabel })
    lastIndex = start + match[0].length
    match = mentionPattern.exec(text)
  }
  if (lastIndex < text.length) {
    tokens.push({ kind: 'text', text: text.slice(lastIndex) })
  }
  return tokens
}

function buildBoldSegments(text: string) {
  return String(text || '').split('**').map((part, index) => ({
    text: part,
    isBold: index % 2 === 1,
  }))
}

function MessageText({
  text,
  textStyle,
  boldStyle,
  onTranscriptMentionPress,
}: {
  text: string
  textStyle: any
  boldStyle?: any
  onTranscriptMentionPress?: (seconds: number) => void
}) {
  const tokens = useMemo(() => buildMentionTokens(text), [text])
  return (
    <Text style={textStyle}>
      {tokens.map((token, tokenIndex) => {
        if (token.kind === 'mention') {
          const seconds = token.timeLabel ? parseTimeLabelToSeconds(token.timeLabel) : null
          if (seconds === null || !onTranscriptMentionPress) {
            return (
              <Text key={`mention-${tokenIndex}`} style={textStyle}>
                {token.text}
              </Text>
            )
          }
          return (
            <TranscriptMention
              key={`mention-${tokenIndex}`}
              label={token.text}
              seconds={seconds}
              onPress={onTranscriptMentionPress}
            />
          )
        }
        const segments = buildBoldSegments(token.text)
        return segments.map((segment, segmentIndex) => (
          <Text key={`segment-${tokenIndex}-${segmentIndex}`} isBold={segment.isBold} style={segment.isBold ? boldStyle : undefined}>
            {segment.text}
          </Text>
        ))
      })}
    </Text>
  )
}

function TranscriptMention({ label, seconds, onPress }: { label: string; seconds: number; onPress: (seconds: number) => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } as any
  return (
    <Text
      isBold
      onPress={() => onPress(seconds)}
      accessibilityRole="link"
      style={[styles.transcriptMention, isHovered ? styles.transcriptMentionHovered : undefined]}
      {...hoverProps}
    >
      {label}
    </Text>
  )
}

function splitBoldSegments(text: string, forceBold = false): DocumentSegment[] {
  const rawText = String(text || '')
  if (forceBold) {
    return [{ text: rawText.replace(/\*\*/g, ''), isBold: true }]
  }
  const parts = rawText.split('**')
  return parts.map((part, index) => ({ text: part, isBold: index % 2 === 1 }))
}

function splitSegmentsIntoTokens(segments: DocumentSegment[]) {
  const tokens: DocumentSegment[] = []
  segments.forEach((segment) => {
    const parts = segment.text.split(/(\s+)/)
    parts.forEach((part) => {
      if (!part) return
      tokens.push({ text: part, isBold: segment.isBold })
    })
  })
  return tokens
}

function splitTokenToFit(document: any, token: DocumentSegment, maxWidth: number, fontSize: number) {
  document.setFont('Helvetica', token.isBold ? 'bold' : 'normal')
  document.setFontSize(fontSize)
  if (document.getTextWidth(token.text) <= maxWidth) return [token]

  const fragments: DocumentSegment[] = []
  let remaining = token.text
  while (remaining.length > 0) {
    let low = 1
    let high = remaining.length
    let fit = 1
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const candidate = remaining.slice(0, mid)
      if (document.getTextWidth(candidate) <= maxWidth) {
        fit = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    fragments.push({ text: remaining.slice(0, fit), isBold: token.isBold })
    remaining = remaining.slice(fit)
  }
  return fragments
}

function wrapSegmentsToLines(document: any, segments: DocumentSegment[], maxWidth: number, fontSize: number) {
  const tokens = splitSegmentsIntoTokens(segments)
  const lines: DocumentSegment[][] = []
  let currentLine: DocumentSegment[] = []
  let currentWidth = 0

  tokens.forEach((tokenBase) => {
    const normalizedTokens = splitTokenToFit(document, tokenBase, maxWidth, fontSize)
    normalizedTokens.forEach((token) => {
      if (!token.text.trim() && currentLine.length === 0) return
      document.setFont('Helvetica', token.isBold ? 'bold' : 'normal')
      document.setFontSize(fontSize)
      const tokenWidth = document.getTextWidth(token.text)

      if (currentLine.length > 0 && currentWidth + tokenWidth > maxWidth) {
        lines.push(currentLine)
        currentLine = []
        currentWidth = 0
      }

      currentLine.push(token)
      currentWidth += tokenWidth
    })
  })

  if (currentLine.length > 0) lines.push(currentLine)
  return lines
}

function buildDocumentLines(messageText: string): DocumentLine[] {
  const lines = parseRichTextMarkdown(messageText)
  return lines.map((line) => {
    if (line.kind === 'headingTwo' || line.kind === 'headingThree') {
      const text = line.segments.map((segment) => segment.text).join('')
      return { kind: line.kind, segments: splitBoldSegments(text, true) }
    }
    if (line.kind === 'bullet' || line.kind === 'paragraph' || line.kind === 'quote') {
      return { kind: line.kind, segments: splitBoldSegments(line.text) }
    }
    if (line.kind === 'numbered') {
      return { kind: line.kind, number: line.number, segments: splitBoldSegments(line.text) }
    }
    return { kind: line.kind, segments: [] }
  })
}

function guessTitleFromLines(lines: DocumentLine[]) {
  const firstHeader = lines.find((l) => l.kind === 'headingTwo' || l.kind === 'headingThree')
  const raw = firstHeader?.segments.map((s) => s.text).join('')?.trim()
  return raw || 'CoachScribe export'
}

function addFooters(
  document: any,
  footerLineY: number,
  marginLeft: number,
  marginRight: number,
  footerFontSize: number,
  websiteLabel: string,
  practiceNameLabel: string,
  accentColor: RgbColor,
) {
  const pageCount = document.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    document.setPage(i)
    const pageWidth = document.internal.pageSize.getWidth()
    const pageHeight = document.internal.pageSize.getHeight()
    document.setDrawColor(accentColor.r, accentColor.g, accentColor.b)
    document.setLineWidth(1)
    document.line(marginLeft, footerLineY, pageWidth - marginRight, footerLineY)
    document.setFont('Helvetica', 'normal')
    document.setFontSize(footerFontSize)
    document.setTextColor(38, 52, 63)
    const pageLabel = String(i)
    const pageLabelWidth = document.getTextWidth(pageLabel)
    document.text(pageLabel, pageWidth - marginRight - pageLabelWidth, pageHeight - 28)
    if (websiteLabel) {
      document.setTextColor(accentColor.r, accentColor.g, accentColor.b)
      const websiteWidth = document.getTextWidth(websiteLabel)
      document.text(websiteLabel, pageWidth - marginRight - websiteWidth, pageHeight - 12)
    }
    if (practiceNameLabel) {
      document.setTextColor(accentColor.r, accentColor.g, accentColor.b)
      document.text(practiceNameLabel, marginLeft, pageHeight - 12)
    }
  }
}

async function addBrandHeader(
  document: any,
  marginTop: number,
  marginRight: number,
  pageWidth: number,
  practiceSettings: PdfPracticeSettings,
  fallbackLogoDataUrl: string | null,
) {
  let logoBottomY = marginTop
  const logoTopMargin = 24
  const logoRightMargin = 24
  const candidateLogos = [String(practiceSettings.logoDataUrl || '').trim(), String(fallbackLogoDataUrl || '').trim()].filter(Boolean)
  const maxWidth = 130
  const maxHeight = 34
  for (const rawLogo of candidateLogos) {
    let drawableLogo = rawLogo
    let dimensions = await getDataUrlImageDimensions(drawableLogo)
    let logoFormat = getPdfImageFormatFromDataUrl(drawableLogo)

    // Convert non-dataURL logos (or unsupported data URLs) to a high-res PNG to preserve sharpness.
    if (!dimensions || !logoFormat) {
      const rasterized = await rasterizeImageToPngDataUrl(rawLogo, maxWidth * 3, maxHeight * 3)
      if (!rasterized) continue
      drawableLogo = rasterized
      dimensions = await getDataUrlImageDimensions(drawableLogo)
      logoFormat = getPdfImageFormatFromDataUrl(drawableLogo)
    }

    if (!logoFormat || !dimensions) continue
    if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) continue
    const scale = Math.min(maxWidth / dimensions.width, maxHeight / dimensions.height)
    const drawWidth = Math.max(1, dimensions.width * scale)
    const drawHeight = Math.max(1, dimensions.height * scale)
    const x = pageWidth - logoRightMargin - drawWidth
    const y = logoTopMargin
    document.addImage(drawableLogo, logoFormat, x, y, drawWidth, drawHeight)
    logoBottomY = y + drawHeight
    break
  }
  if (logoBottomY <= marginTop) return 0
  return 0
}

function buildPdfFileName(title: string) {
  const rawTitle = String(title || '').trim() || 'Verslag'
  const safeTitle = rawTitle.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim()
  return `${safeTitle || 'Verslag'}.pdf`
}

function buildWordFileName(title: string) {
  const rawTitle = String(title || '').trim() || 'Verslag'
  const safeTitle = rawTitle.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim()
  return `${safeTitle || 'Verslag'}.doc`
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function segmentsToWordHtml(segments: DocumentSegment[]) {
  return segments
    .map((segment) => {
      const safeText = escapeHtml(segment.text)
      return segment.isBold ? `<strong>${safeText}</strong>` : safeText
    })
    .join('')
}

function buildWordBodyHtml(messageText: string) {
  const lines = buildDocumentLines(messageText)
  const htmlLines: string[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (line.kind === 'empty') {
      htmlLines.push('<p class="spacer">&nbsp;</p>')
      index += 1
      continue
    }
    if (line.kind === 'divider') {
      htmlLines.push('<hr />')
      index += 1
      continue
    }
    if (line.kind === 'headingTwo') {
      htmlLines.push(`<h2>${segmentsToWordHtml(line.segments)}</h2>`)
      index += 1
      continue
    }
    if (line.kind === 'headingThree') {
      htmlLines.push(`<h3>${segmentsToWordHtml(line.segments)}</h3>`)
      index += 1
      continue
    }
    if (line.kind === 'quote') {
      htmlLines.push(`<blockquote>${segmentsToWordHtml(line.segments)}</blockquote>`)
      index += 1
      continue
    }
    if (line.kind === 'bullet') {
      const items: string[] = []
      while (index < lines.length && lines[index].kind === 'bullet') {
        items.push(`<li>${segmentsToWordHtml(lines[index].segments)}</li>`)
        index += 1
      }
      htmlLines.push(`<ul class="list">${items.join('')}</ul>`)
      continue
    }
    if (line.kind === 'numbered') {
      const items: string[] = []
      const start = Math.max(1, line.number || 1)
      let expectedNumber = start
      while (index < lines.length && lines[index].kind === 'numbered') {
        const currentLine = lines[index]
        const currentNumber = Math.max(1, currentLine.number || expectedNumber)
        if (items.length > 0 && currentNumber !== expectedNumber) break
        items.push(`<li>${segmentsToWordHtml(currentLine.segments)}</li>`)
        expectedNumber = currentNumber + 1
        index += 1
      }
      htmlLines.push(`<ol class="list"${start > 1 ? ` start="${start}"` : ''}>${items.join('')}</ol>`)
      continue
    }
    htmlLines.push(`<p>${segmentsToWordHtml(line.segments)}</p>`)
    index += 1
  }
  return htmlLines.join('\n')
}

export async function exportMessageToWord(messageText: string, reportTitle: string | undefined, _practiceSettings: PdfPracticeSettings) {
  if (typeof window === 'undefined') return
  const bodyHtml = buildWordBodyHtml(messageText)
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { margin: 56pt; }
      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #26343f; margin: 0; }
      p { margin: 0 0 10pt 0; line-height: 1.45; }
      .spacer { margin: 0 0 8pt 0; }
      h2 { font-size: 18pt; margin: 0 0 8pt 0; color: #26343f; }
      h3 { font-size: 14pt; margin: 0 0 8pt 0; color: #26343f; }
      .list { margin: 0 0 10pt 0; padding-left: 24pt; }
      .list li { margin: 0; line-height: 1.45; }
      blockquote { margin: 0 0 10pt 0; padding-left: 10pt; border-left: 2pt solid #bdccd8; }
      hr { border: 0; border-top: 1pt solid #d7dee4; margin: 8pt 0; }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
  const downloadUrl = URL.createObjectURL(blob)
  const fileName = buildWordFileName(reportTitle || '')
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
}

export async function exportMessageToPdf(messageText: string, reportTitle: string | undefined, practiceSettings: PdfPracticeSettings) {
  if (typeof window === 'undefined') return
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const marginTop = 56
  const marginLeft = 56
  const marginRight = 56
  const footerHeight = 56
  const footerLineY = pageHeight - footerHeight
  const contentX = marginLeft
  const maxWidth = pageWidth - marginLeft - marginRight
  const accentColor = hexToRgbColor(practiceSettings.tintColor)

  const bodyLineHeight = 17
  const headingTwoFontSize = 20
  const headingThreeFontSize = 14
  const textFontSize = 11.5
  const footerFontSize = 9

  const textColor = { r: 38, g: 52, b: 63 }
  const strongTextColor = { r: accentColor.r, g: accentColor.g, b: accentColor.b }

  const lines = buildDocumentLines(messageText)
  const headerLineIndexes = lines.flatMap((line, index) => (line.kind === 'headingTwo' || line.kind === 'headingThree' ? [index] : []))
  const fallbackTitle = lines[headerLineIndexes[0]]?.segments.map((segment) => segment.text).join('').trim()
  const title = String(reportTitle || '').trim() || fallbackTitle || 'CoachScribe export'
  const fallbackLogoDataUrl = await getCoachscribeFallbackLogoDataUrl()
  const brandHeaderOffset = await addBrandHeader(
    doc,
    marginTop,
    marginRight,
    pageWidth,
    practiceSettings,
    fallbackLogoDataUrl,
  )
  let cursorY = marginTop + brandHeaderOffset

  const ensureSpace = (needed: number) => {
    if (cursorY + needed <= footerLineY - 12) return
    doc.addPage()
    cursorY = marginTop + brandHeaderOffset
  }

  const drawSegmentsLine = (segments: DocumentSegment[], x: number, y: number, color: RgbColor | { r: number; g: number; b: number }, fontSize: number) => {
    let cursorX = x
    segments.forEach((seg) => {
      doc.setFont('Helvetica', seg.isBold ? 'bold' : 'normal')
      doc.setFontSize(fontSize)
      doc.setTextColor(color.r, color.g, color.b)
      doc.text(seg.text, cursorX, y)
      cursorX += doc.getTextWidth(seg.text)
    })
  }

  lines.forEach((line) => {
    if (line.kind === 'empty') {
      ensureSpace(bodyLineHeight)
      cursorY += bodyLineHeight
      return
    }

    if (line.kind === 'divider') {
      ensureSpace(bodyLineHeight)
      doc.setDrawColor(215, 222, 228)
      doc.setLineWidth(0.7)
      doc.line(contentX, cursorY + 6, pageWidth - marginRight, cursorY + 6)
      cursorY += bodyLineHeight
      return
    }

    if (line.kind === 'headingTwo' || line.kind === 'headingThree') {
      const isHeadingTwo = line.kind === 'headingTwo'
      const fontSize = isHeadingTwo ? headingTwoFontSize : headingThreeFontSize
      const lineHeight = isHeadingTwo ? 24 : 20
      const spacingAfter = isHeadingTwo ? 6 : 4
      const color = strongTextColor
      const wrapped = wrapSegmentsToLines(doc, line.segments, maxWidth, fontSize)
      // Keep a section header away from the page bottom by reserving room for the full
      // header block plus at least five body lines that follow the section.
      const headingBlockHeight = wrapped.length * lineHeight + (wrapped.length > 0 ? 2 : 0) + spacingAfter
      const sectionStartMinimumHeight = headingBlockHeight + bodyLineHeight * 5
      ensureSpace(sectionStartMinimumHeight)
      wrapped.forEach((segments, idx) => {
        ensureSpace(lineHeight)
        drawSegmentsLine(segments, contentX, cursorY, color, fontSize)
        cursorY += lineHeight
        if (idx === 0) cursorY += 2
      })
      cursorY += spacingAfter
      return
    }

    if (line.kind === 'bullet') {
      const marker = '\u2022'
      const markerWidth = 12
      const wrapped = wrapSegmentsToLines(doc, line.segments, maxWidth - markerWidth, textFontSize)
      wrapped.forEach((segments, lineIndex) => {
        ensureSpace(bodyLineHeight)
        if (lineIndex === 0) {
          doc.setFont('Helvetica', 'normal')
          doc.setFontSize(textFontSize)
          doc.setTextColor(textColor.r, textColor.g, textColor.b)
          doc.text(marker, contentX, cursorY)
        }
        drawSegmentsLine(segments, contentX + markerWidth, cursorY, textColor, textFontSize)
        cursorY += bodyLineHeight
      })
      cursorY += 2
      return
    }

    if (line.kind === 'numbered') {
      const marker = `${line.number || 1}.`
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(textFontSize)
      const markerGap = 8
      const markerWidth = Math.max(18, doc.getTextWidth(marker))
      const markerTotalWidth = markerWidth + markerGap
      const wrapped = wrapSegmentsToLines(doc, line.segments, maxWidth - markerTotalWidth, textFontSize)
      wrapped.forEach((segments, lineIndex) => {
        ensureSpace(bodyLineHeight)
        if (lineIndex === 0) {
          doc.setTextColor(textColor.r, textColor.g, textColor.b)
          doc.text(marker, contentX, cursorY)
        }
        drawSegmentsLine(segments, contentX + markerTotalWidth, cursorY, textColor, textFontSize)
        cursorY += bodyLineHeight
      })
      cursorY += 2
      return
    }

    if (line.kind === 'quote') {
      const quoteInset = 12
      const quoteBarX = contentX + 2
      const wrapped = wrapSegmentsToLines(doc, line.segments, maxWidth - quoteInset - 4, textFontSize)
      wrapped.forEach((segments) => {
        ensureSpace(bodyLineHeight)
        doc.setDrawColor(189, 204, 216)
        doc.setLineWidth(1.2)
        doc.line(quoteBarX, cursorY - 11, quoteBarX, cursorY + 3)
        drawSegmentsLine(segments, contentX + quoteInset, cursorY, textColor, textFontSize)
        cursorY += bodyLineHeight
      })
      cursorY += 2
      return
    }

    // normal text
    const wrapped = wrapSegmentsToLines(doc, line.segments, maxWidth, textFontSize)
    wrapped.forEach((segments) => {
      ensureSpace(bodyLineHeight)
      drawSegmentsLine(segments, contentX, cursorY, textColor, textFontSize)
      cursorY += bodyLineHeight
    })
    cursorY += 2
  })

  addFooters(
    doc,
    footerLineY,
    marginLeft,
    marginRight,
    footerFontSize,
    String(practiceSettings.website || '').trim(),
    String(practiceSettings.practiceName || '').trim(),
    accentColor,
  )
  const fileName = buildPdfFileName(title)
  const pdfBlob = doc.output('blob')
  const downloadUrl = URL.createObjectURL(pdfBlob)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
}

function renderInlineSegments({
  segments,
  textStyle,
  boldStyle,
  onTranscriptMentionPress,
}: {
  segments: RichTextInlineSegment[]
  textStyle: any
  boldStyle?: any
  onTranscriptMentionPress?: (seconds: number) => void
}) {
  return (
    <Text style={textStyle}>
      {segments.map((segment, segmentIndex) => {
        const segmentTokens = buildMentionTokens(segment.text)
        return segmentTokens.map((token, tokenIndex) => {
          if (token.kind === 'mention') {
            const seconds = token.timeLabel ? parseTimeLabelToSeconds(token.timeLabel) : null
            if (seconds === null || !onTranscriptMentionPress) {
              return (
                <Text key={`mention-${segmentIndex}-${tokenIndex}`} style={segment.isItalic ? styles.italicText : undefined} isBold={segment.isBold}>
                  {token.text}
                </Text>
              )
            }
            return (
              <TranscriptMention
                key={`mention-${segmentIndex}-${tokenIndex}`}
                label={token.text}
                seconds={seconds}
                onPress={onTranscriptMentionPress}
              />
            )
          }
          return (
            <Text
              key={`text-${segmentIndex}-${tokenIndex}`}
              isBold={segment.isBold}
              style={[
                segment.isItalic ? styles.italicText : undefined,
                segment.isBold ? boldStyle : undefined,
              ]}
            >
              {token.text}
            </Text>
          )
        })
      })}
    </Text>
  )
}

export function ChatMessage({ role, text, isLoading, onTranscriptMentionPress, exportTitle, onRequestPdfEdit }: Props) {
  const { data } = useLocalAppData() as any
  const practiceSettings = (data as any)?.practiceSettings ?? {}
  const pdfPracticeSettings = useMemo<PdfPracticeSettings>(
    () => ({
      practiceName: practiceSettings.practiceName,
      website: practiceSettings.website,
      tintColor: practiceSettings.tintColor,
      logoDataUrl: practiceSettings.logoDataUrl,
    }),
    [practiceSettings.logoDataUrl, practiceSettings.practiceName, practiceSettings.tintColor, practiceSettings.website],
  )
  const isAssistant = role === 'assistant'
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const exportableText = resolveExportableMessageText(text)
  const displayText = removeExportMarkers(text)
  const lines = parseRichTextMarkdown(displayText || '')
  const isExportable = false

  if (isAssistant) {
    return (
      <View style={[styles.assistantRow, isLoading ? styles.assistantRowLoading : undefined]}>
        <View style={styles.assistantContent}>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <LoadingSpinner size="small" />
              <Text style={styles.loadingText}>Aan het nadenken</Text>
            </View>
          ) : (
            <>
              <View style={styles.bubble}>
                <View style={styles.formattedLines}>
                  {lines.map((line, lineIndex) => {
                    if (line.kind === 'empty') return <View key={`line-${lineIndex}`} style={styles.emptyLine} />
                    if (line.kind === 'divider') {
                      return (
                        <View key={`line-${lineIndex}`} style={styles.dividerRow}>
                          <View style={styles.dividerLine} />
                        </View>
                      )
                    }
                    if (line.kind === 'headingTwo' || line.kind === 'headingThree') {
                      return (
                        <View key={`line-${lineIndex}`}>
                          {renderInlineSegments({
                            segments: line.segments,
                            textStyle: styles.headerText,
                            boldStyle: styles.headerTextBold,
                            onTranscriptMentionPress,
                          })}
                        </View>
                      )
                    }
                    if (line.kind === 'bullet') {
                      return (
                        <View key={`line-${lineIndex}`} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <View style={styles.bulletText}>
                            {renderInlineSegments({ segments: line.segments, textStyle: styles.messageText, onTranscriptMentionPress })}
                          </View>
                        </View>
                      )
                    }
                    if (line.kind === 'numbered') {
                      return (
                        <View key={`line-${lineIndex}`} style={styles.bulletRow}>
                          <Text style={styles.numberedPrefix}>{`${line.number}.`}</Text>
                          <View style={styles.bulletText}>
                            {renderInlineSegments({ segments: line.segments, textStyle: styles.messageText, onTranscriptMentionPress })}
                          </View>
                        </View>
                      )
                    }
                    if (line.kind === 'quote') {
                      return (
                        <View key={`line-${lineIndex}`} style={styles.quoteRow}>
                          {renderInlineSegments({
                            segments: line.segments,
                            textStyle: styles.quoteText,
                            onTranscriptMentionPress,
                          })}
                        </View>
                      )
                    }
                    return (
                      <View key={`line-${lineIndex}`}>
                        {renderInlineSegments({
                          segments: line.segments,
                          textStyle: styles.messageText,
                          onTranscriptMentionPress,
                        })}
                      </View>
                    )
                  })}
                </View>
              </View>

              <View style={styles.messageActionsRow}>
                <Pressable
                  onPress={() => {
                    if (typeof navigator === 'undefined') return
                    navigator.clipboard?.writeText(String(displayText || '')).then(() => {
                      setShowCopyNotification(true)
                      setTimeout(() => setShowCopyNotification(false), 3000)
                    })
                  }}
                  style={({ hovered }) => [styles.actionButton, hovered ? styles.actionButtonHovered : undefined]}
                >
                  {showCopyNotification ? <CopiedIcon size={18} /> : <CopyIcon color="#8E8480" size={18} />}
                </Pressable>

                {isExportable ? (
                  <>
                    <Pressable
                      onPress={() => {
                        const nextText = exportableText || displayText
                        if (onRequestPdfEdit) {
                          onRequestPdfEdit({ text: nextText, title: exportTitle, practiceSettings: pdfPracticeSettings })
                          return
                        }
                        void exportMessageToPdf(nextText, exportTitle, pdfPracticeSettings)
                      }}
                      style={({ hovered }) => [styles.exportButton, hovered ? styles.exportButtonHovered : undefined]}
                    >
                      <Text isSemibold style={styles.exportButtonText}>
                        Exporteer als PDF
                      </Text>
                      <SharePdfIcon color={colors.textSecondary} size={18} />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const nextText = exportableText || displayText
                        void exportMessageToWord(nextText, exportTitle, pdfPracticeSettings)
                      }}
                      style={({ hovered }) => [styles.exportButton, hovered ? styles.exportButtonHovered : undefined]}
                    >
                      <Text isSemibold style={styles.exportButtonText}>
                        Exporteer als Word-document
                      </Text>
                      <ShareTextIcon color={colors.textSecondary} size={18} />
                    </Pressable>
                  </>
                ) : null}
              </View>
            </>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <View style={styles.formattedLines}>
          {parseRichTextMarkdown(text || '').map((line, lineIndex) => {
            if (line.kind === 'empty') return <View key={`user-line-${lineIndex}`} style={styles.emptyLine} />
            if (line.kind === 'divider') {
              return (
                <View key={`user-line-${lineIndex}`} style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                </View>
              )
            }
            if (line.kind === 'headingTwo' || line.kind === 'headingThree') {
              return (
                <View key={`user-line-${lineIndex}`}>
                  {renderInlineSegments({
                    segments: line.segments,
                    textStyle: styles.userText,
                    boldStyle: styles.userTextBold,
                  })}
                </View>
              )
            }
            if (line.kind === 'bullet') {
              return (
                <View key={`user-line-${lineIndex}`} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <View style={styles.bulletText}>{renderInlineSegments({ segments: line.segments, textStyle: styles.userText })}</View>
                </View>
              )
            }
            if (line.kind === 'numbered') {
              return (
                <View key={`user-line-${lineIndex}`} style={styles.bulletRow}>
                  <Text style={styles.numberedPrefix}>{`${line.number}.`}</Text>
                  <View style={styles.bulletText}>{renderInlineSegments({ segments: line.segments, textStyle: styles.userText })}</View>
                </View>
              )
            }
            if (line.kind === 'quote') {
              return (
                <View key={`user-line-${lineIndex}`} style={styles.quoteRow}>
                  {renderInlineSegments({
                    segments: line.segments,
                    textStyle: styles.userQuoteText,
                  })}
                </View>
              )
            }
            return (
              <View key={`user-line-${lineIndex}`}>
                {renderInlineSegments({ segments: line.segments, textStyle: styles.userText })}
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  assistantRow: { width: '100%', flexDirection: 'row', alignItems: 'flex-start' },
  assistantRowLoading: { alignItems: 'center' },
  assistantContent: { flex: 1 },
  bubble: { backgroundColor: colors.assistantBubble, borderRadius: 12, padding: 16, gap: 12 },
  exportButton: { height: 32, borderRadius: 8, padding: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  exportButtonHovered: { backgroundColor: colors.hoverBackground },
  exportButtonText: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  formattedLines: { gap: 8 },
  headerText: { fontSize: 16, lineHeight: 22, color: colors.text },
  headerTextBold: { fontSize: 16, lineHeight: 22, color: colors.text },
  italicText: { fontStyle: 'italic' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.text, marginTop: 7 },
  bulletText: { flex: 1 },
  numberedPrefix: { fontSize: 14, lineHeight: 20, color: colors.text, minWidth: 20 },
  quoteRow: { borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 10 },
  quoteText: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  dividerRow: { width: '100%', paddingVertical: 6 },
  dividerLine: { width: '100%', height: 1, backgroundColor: colors.border },
  emptyLine: { height: 8 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  messageText: { fontSize: 14, lineHeight: 20, color: colors.text },
  messageActionsRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 8 },
  actionButton: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  actionButtonHovered: { backgroundColor: colors.hoverBackground },
  copyNotification: { alignItems: 'center' },
  copyNotificationText: { fontSize: 12, lineHeight: 16, color: colors.selected, textAlign: 'center' },
  userRow: { width: '100%', flexDirection: 'row', justifyContent: 'flex-end' },
  userBubble: { maxWidth: 520, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12 },
  userText: { fontSize: 14, lineHeight: 20, color: colors.text },
  userTextBold: { fontSize: 14, lineHeight: 20, color: colors.text },
  userQuoteText: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  transcriptMention: {
    textDecorationLine: 'underline',
    color: colors.text,
    ...( { cursor: 'pointer' } as any ),
  },
  transcriptMentionHovered: {
    color: colors.selected,
  },
})



