import CodeDisplay from "../../primitive/CodeDisplay/CodeDisplay";
import Button from "../../primitive/Button/Button";
import Text from "../../primitive/Text/Text";
import Spinner from "../../primitive/Spinner/Spinner";
import ProgressBar from "../../primitive/ProgressBar/ProgressBar";
import { useDeviceCodeFlow } from "./behavior/useDeviceCodeFlow";
import { useCountdown, formatTime } from "./behavior/useCountdown";
import type { DeviceCodeChallenge } from "./types";
import type { PostMessage } from "../../../types";
import "./DeviceCodeAuth.css";

interface Props {
  challenge: DeviceCodeChallenge | null;
  postMessage: PostMessage;
  waiting?: boolean;
}

export default function DeviceCodeAuth({ challenge, postMessage, waiting }: Props) {
  const { copied, copyCode, openUrl } = useDeviceCodeFlow(postMessage);
  const remaining = useCountdown(challenge?.expiresIn);

  if (waiting && !challenge) {
    return (
      <div className="device-code-auth">
        <Spinner size="sm" />
        <Text variant="waiting">Connecting…</Text>
      </div>
    );
  }

  if (!challenge) return null;

  const expired = remaining === 0;
  const total = challenge.expiresIn ?? 0;
  const progress = total > 0 && remaining != null ? remaining / total : 0;

  return (
    <div className="device-code-auth">
      {challenge.source === "mcp" ? (
        <Text>A sign-in was initiated from Copilot chat. Enter this code in the browser:</Text>
      ) : (
        <Text>Enter the following code to complete sign-in:</Text>
      )}

      <CodeDisplay
        code={challenge.code}
        onCopy={() => copyCode(challenge.code)}
        copied={copied}
      />

      <Button onClick={() => openUrl(challenge.uri)} style={{ marginTop: 12 }}>
        Open Link
      </Button>
      <a
        className="device-code-auth__link"
        href={challenge.uri}
        onClick={(e) => { e.preventDefault(); openUrl(challenge.uri); }}
      >
        {challenge.uri}
      </a>

      <div className="device-code-auth__status">
        {expired ? (
          <Text variant="error">Code expired. Please try again.</Text>
        ) : remaining != null ? (
          <div className="device-code-auth__countdown">
            <Text variant="hint" className="device-code-auth__timer">
              {formatTime(remaining)}
            </Text>
            <ProgressBar progress={progress} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
