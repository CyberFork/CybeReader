import { useApp } from "../context/AppContext";
const themes = [
  { name: "深海", backgroundColor: "#09151d", fontColor: "#d9eef5", highlightColor: "#214f5b" },
  { name: "纸白", backgroundColor: "#faf9f5", fontColor: "#26343b", highlightColor: "#b9e8df" },
  { name: "暖沙", backgroundColor: "#f3e7ce", fontColor: "#493d2e", highlightColor: "#e8cb88" },
  { name: "苔绿", backgroundColor: "#dce8d7", fontColor: "#233d2d", highlightColor: "#a4c89b" },
  { name: "暮紫", backgroundColor: "#201b30", fontColor: "#ece2ff", highlightColor: "#584473" },
];
export function ThemePicker() {
  const { settings, updateSettings } = useApp();
  return <div className="theme-picker" role="group" aria-label="阅读配色主题">
    {themes.map(({ name, ...colors }) => <button key={name} title={`${name}主题`} aria-label={`${name}主题`}
      aria-pressed={Object.entries(colors).every(([key, value]) => settings[key as keyof typeof colors] === value)}
      style={{ backgroundColor: colors.backgroundColor, color: colors.fontColor, borderColor: colors.highlightColor }}
      onClick={() => updateSettings(colors)}>{name}</button>)}
  </div>;
}
