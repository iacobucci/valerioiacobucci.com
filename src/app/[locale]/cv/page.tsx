'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import localFont from 'next/font/local';

import face from './face.jpg';

const cmunrm = localFont({
	src: './cmunrm.ttf',
	display: 'swap',
});

export default function CVPage() {
	const t = useTranslations('cv');

	const print = () => {
		window.print();
	};

	const today = new Date().toLocaleDateString();

	return (
	        <div className={`${cmunrm.className} max-w-[210mm] mx-auto py-8 shadow-lg dark:shadow-2xs m-8 p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
	                <style dangerouslySetInnerHTML={{ __html: `
	                        @page {
	                                size: 210mm 297mm;
	                                margin: 27mm 16mm 27mm 16mm;
	                        }

	                        @media print {
	                                @page {
	                                        size: A4;
	                                        margin: 10mm;
	                                }

	                                body * {
	                                        visibility: hidden;
	                                }

	                                #pdf,
	                                #pdf * {
	                                        visibility: visible;
	                                }

	                                #pdf {
	                                        position: absolute;
	                                        left: 0;
	                                        top: 0;
	                                        width: 210mm;
	                                }
	                        }
	                `}} />
	                <div id="pdf" className="print:absolute print:left-0 print:top-0 print:w-[210mm]">				<div className="flex flex-col gap-2">
				<div className="flex justify-center items-center mb-6 mt-4">
					<div className="w-1/3 text-right pr-3">
						<h1 className="font-normal text-3xl m-1">
							{t('title')}
						</h1>
						<h3 id="update" className="font-normal text-base m-1">
							{t('updated_to')} {today}
						</h3>
						<button
							onClick={print}
							className="text-xs text-blue-600 dark:text-blue-400 hover:underline print:hidden"
						>
							{t('download_pdf')}
						</button>
					</div>

					<div className="w-2/3 text-left pl-3">
						<Image
							src={face}
							width={160}
							height={160}
							className="w-40 rounded"
							alt="Face"
							loading='eager'
						/>
					</div>
				</div>

				<Section label={t('personal_info.name')} value={t('personal_info_values.name')} />
				<Section label={t('personal_info.surname')} value={t('personal_info_values.surname')} />
				<Section label={t('personal_info.birth_date')} value={t('personal_info_values.birth_date')} />
				<Section label={t('personal_info.phone')} value={t('personal_info_values.phone')} />

				<div className="flex items-center">
					<div className="w-1/3 text-right pr-3">
						<h4 className="font-normal m-1 text-sm">{t('personal_info.email')}:</h4>
					</div>
					<div className="w-2/3 text-left pl-3">
						<a href="mailto:iacobuccivalerio@gmail.com" className="text-blue-600 dark:text-blue-500 hover:underline">
							<h3 className="font-normal m-1 text-base">iacobuccivalerio@gmail.com</h3>
						</a>
					</div>
				</div>

				<SectionLink label={t('personal_info.website')} href="https://valerioiacobucci.com" />
				<SectionLink label={t('personal_info.github')} href="https://github.com/iacobucci" />
				<SectionLink label={t('personal_info.linkedin')} href="https://www.linkedin.com/in/valerioiacobucci" />

				<TitleSection title={t('education.title')} />

				<EducationItem
					label={t('education.high_school.label')}
					desc={t('education.high_school.desc')}
					period={t('education.high_school.period')}
				/>
				<EducationItem
					label={t('education.english.label')}
					desc={t('education.english.desc')}
					period={t('education.english.period')}
				/>

				<div className="flex items-center mt-2">
					<div className="w-1/3 text-right pr-3">
						<h4 className="font-normal m-1 text-sm">{t('education.bachelor.label')}:</h4>
					</div>
					<div className="w-2/3 text-left pl-3">
						<h3 className="font-normal m-1 text-base">
							{t('education.bachelor.desc_prefix')}{' '}
							<a href="https://valerioiacobucci.com/pdf/tesi-triennale.pdf" className="text-blue-600 dark:text-blue-500 hover:underline">
								{t('education.bachelor.thesis_link_text')}
							</a>.
						</h3>
						<h3 className="font-normal m-1 text-base">{t('education.bachelor.period')}</h3>
					</div>
				</div>

				<EducationItem
					label={t('education.master.label')}
					desc={t('education.master.desc')}
					period={t('education.master.period')}
				/>

				<TitleSection title={t('work_experience.title')} />
				<EducationItem
					label={t('work_experience.internship.label')}
					desc={t('work_experience.internship.desc')}
					period={t('work_experience.internship.period')}
				/>

				<TitleSection title={t('languages.title')} />
				<Section label={t('languages.native.label')} value={t('languages.native.desc')} />
				<Section label={t('languages.other.label')} value={t('languages.other.desc')} />

				<TitleSection title={t('technical_skills.title')} />

				<SkillItem label={t('technical_skills.programming_principles')} desc={t('technical_skills.programming_principles_desc')} />
				<SkillItem label={t('technical_skills.system_programming')} desc={t('technical_skills.system_programming_desc')} />
				<SkillItem label={t('technical_skills.web_frameworks')} desc={t('technical_skills.web_frameworks_desc')} />
				<SkillItem label={t('technical_skills.frontend_web')} desc={t('technical_skills.frontend_web_desc')} />
				<SkillItem label={t('technical_skills.frontend_mobile_desktop')} desc={t('technical_skills.frontend_mobile_desktop_desc')} />
				<SkillItem label={t('technical_skills.databases')} desc={t('technical_skills.databases_desc')} />
				<SkillItem label={t('technical_skills.devops')} desc={t('technical_skills.devops_desc')} />
				<SkillItem label={t('technical_skills.data_science')} desc={t('technical_skills.data_science_desc')} />
				<SkillItem label={t('technical_skills.embedded')} desc={t('technical_skills.embedded_desc')} />
				<SkillItem label={t('technical_skills.multimedia_software')} desc={t('technical_skills.multimedia_software_desc')} />
			</div>
			</div>
		</div>
	);
}

function Section({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center">
			<div className="w-1/3 text-right pr-3">
				<h4 className="font-normal m-1 text-sm">{label}:</h4>
			</div>
			<div className="w-2/3 text-left pl-3">
				<h3 className="font-normal m-1 text-base">{value}</h3>
			</div>
		</div>
	);
}

function SectionLink({ label, href }: { label: string; href: string }) {
	return (
		<div className="flex items-center">
			<div className="w-1/3 text-right pr-3">
				<h4 className="font-normal m-1 text-sm">{label}:</h4>
			</div>
			<div className="w-2/3 text-left pl-3">
				<a href={href} className="text-blue-600 dark:text-blue-500 hover:underline">
					<h3 className="font-normal m-1 text-base">{href}</h3>
				</a>
			</div>
		</div>
	);
}

function TitleSection({ title }: { title: string }) {
	return (
		<div className="flex items-center mt-6 mb-2">
			<div className="w-1/3 text-right pr-3">
				<h2 className="font-normal m-1 text-2xl">{title}</h2>
			</div>
			<div className="w-2/3 text-left pl-3 pr-6">
				<hr className="border-t-[0.5px] border-gray-900 dark:border-gray-200 w-full" />
			</div>
		</div>
	);
}

function EducationItem({ label, desc, period }: { label: string; desc: string; period?: string }) {
	return (
		<div className="flex items-center">
			<div className="w-1/3 text-right pr-3">
				<h4 className="font-normal m-1 text-sm">{label}:</h4>
			</div>
			<div className="w-2/3 text-left pl-3">
				<h3 className="font-normal m-1 text-base">{desc}</h3>
				{period && <h3 className="font-normal m-1 text-base">{period}</h3>}
			</div>
		</div>
	);
}

function SkillItem({ label, desc }: { label: string; desc: string }) {
	return (
		<div className="flex items-center">
			<div className="w-1/3 text-right pr-3">
				<h4 className="font-normal m-1 text-xs">{label}:</h4>
			</div>
			<div className="w-2/3 text-left pl-3">
				<h3 className="font-normal m-1 text-sm">{desc}</h3>
			</div>
		</div>
	);
}
