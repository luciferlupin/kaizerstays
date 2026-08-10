import ChannelsClient from "./ChannelsClient";
import { getChannelProviderRuntime } from "@/lib/channel-manager-server";

export const metadata = {
  title: "Channel Manager & OTA Sync — KaizerStays",
};

export default function ChannelsPage() {
  return <ChannelsClient providerRuntime={getChannelProviderRuntime()} />;
}
