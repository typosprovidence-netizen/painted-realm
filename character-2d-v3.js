/* V3 character presentation; original skill/attack overlays retained verbatim. */
function draw2DPlayerInk(ctx, view) {
      const unit = view.scale;
      const px = view.sx(p2d.u);
      const py = view.sy(p2d.v);
      const moving = p2d.grounded && Math.abs(p2d.vu) > 0.25;
      const bob = p2d.grounded ? Math.abs(Math.sin(p2d.stepPhase)) * 0.025 : 0;
      const tilt = p2d.grounded ? 0 : clamp(-p2d.vv * 0.011, -0.1, 0.09);

      if (p2d.grounded) {
        ctx.save();
        ctx.translate(px, py + unit * 0.035);
        ctx.scale(1, 0.28);
        const shadow = ctx.createRadialGradient(0, 0, 1, 0, 0, unit * 0.82);
        shadow.addColorStop(0, 'rgba(48,58,49,.48)');
        shadow.addColorStop(1, 'rgba(48,58,49,0)');
        ctx.fillStyle = shadow;
        ctx.beginPath();
        ctx.arc(0, 0, unit * 0.82, 0, TAU);
        ctx.fill();
        ctx.restore();
      }

      // 2D 奥义：橙红火焰环 + 黑烟内圈
      if (p2d.ultimateFxTimer > 0) {
        const total = 0.9;
        const t = 1 - p2d.ultimateFxTimer / total;
        ctx.save();
        ctx.translate(px, py - unit * 0.62);
        ctx.scale(1, 0.38);
        ctx.strokeStyle = 'rgba(164,59,48,' + ((1 - t) * 0.82).toFixed(3) + ')';
        ctx.lineWidth = Math.max(2, unit * 0.075 * (1 - t) + 1);
        ctx.beginPath();
        ctx.arc(0, 0, unit * (1.0 + t * 5.2), 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(48,58,49,' + ((1 - t) * 0.66).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1, unit * 0.03);
        ctx.beginPath();
        ctx.arc(0, 0, unit * (0.7 + t * 3.8), 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(164,59,48,' + ((1 - t) * 0.5).toFixed(3) + ')';
        ctx.lineWidth = Math.max(2, unit * 0.06);
        ctx.beginPath();
        ctx.arc(0, 0, unit * (0.45 + t * 2.7), 0, TAU);
        ctx.stroke();
        ctx.restore();
        for (let i = 0; i < 10; i += 1) {
          const a = i * 2.399 + t * 2.1;
          const r = unit * (0.7 + t * 5.4);
          ctx.fillStyle = 'rgba(164,59,48,' + ((1 - t) * 0.55).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(px + Math.cos(a) * r, py - unit * 0.62 + Math.sin(a) * r * 0.38, Math.max(1, unit * 0.035), 0, TAU);
          ctx.fill();
        }
      }

      drawWalkerV3(ctx, view, px, py, bob, tilt, moving);

      // 2D 冲刺/加速速度线
      if (sprintActive && p2d.grounded) {
        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i += 1) {
          const side = -p2d.facing;
          const y = py - unit * (0.35 + i * 0.32);
          const x0 = px + side * unit * 0.55;
          ctx.strokeStyle = 'rgba(48,58,49,' + (0.28 - i * 0.06).toFixed(3) + ')';
          ctx.lineWidth = Math.max(1, unit * 0.025);
          ctx.beginPath();
          ctx.moveTo(x0, y);
          ctx.lineTo(x0 + side * unit * (1.1 + i * 0.35), y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 二段跳的空中环
      if (p2d.doubleJumpFlash > 0) {
        const t = 1 - p2d.doubleJumpFlash / 0.28;
        ctx.save();
        ctx.strokeStyle = 'rgba(48,58,49,' + ((1 - t) * 0.65).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1.5, unit * 0.035);
        ctx.beginPath();
        ctx.ellipse(
          px,
          py - unit * 0.9,
          unit * (0.8 + t * 1.5),
          unit * (0.24 + t * 0.42),
          0,
          0,
          TAU
        );
        ctx.stroke();
        ctx.restore();
      }

      // [攻击] 2D 横向长、上下窄的挥砍；与 3D 的大扇形形成对比。
      if (attack2DTimer > 0) {
        const slashT = 1 - attack2DTimer / 0.22;
        const alpha = Math.sin(clamp(slashT, 0, 1) * Math.PI);
        ctx.save();
        ctx.translate(px, py - unit * 1.08);
        ctx.scale(p2d.facing, 1);
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(48,58,49,' + (alpha * 0.78).toFixed(3) + ')';
        ctx.lineWidth = Math.max(2.5, unit * 0.06);
        ctx.beginPath();
        ctx.ellipse(0, 0, unit * 2.9, unit * 0.72, 0, -0.85 + slashT * 0.45, 0.85 + slashT * 0.45);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(48,58,49,' + (alpha * 0.34).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1, unit * 0.025);
        ctx.beginPath();
        ctx.ellipse(0, 0, unit * 2.45, unit * 0.56, 0, -0.72 + slashT * 0.45, 0.72 + slashT * 0.45);
        ctx.stroke();
        ctx.restore();
      }

      // 2D 破军：橙红火焰长弧；二段为更大的灭神斩
      if (p2d.fireSlashTimer > 0) {
        const total = p2d.fireSlashBig ? 0.42 : 0.3;
        const t = 1 - p2d.fireSlashTimer / total;
        const alpha = Math.sin(clamp(t, 0, 1) * Math.PI);
        ctx.save();
        ctx.translate(px, py - unit * 1.08);
        ctx.scale(p2d.facing, 1);
        ctx.lineCap = 'round';
        const radiusX = unit * (p2d.fireSlashBig ? 4.6 : 2.95);
        const radiusY = unit * (p2d.fireSlashBig ? 1.08 : 0.7);
        ctx.strokeStyle = 'rgba(164,59,48,' + (alpha * 0.92).toFixed(3) + ')';
        ctx.lineWidth = Math.max(2.5, unit * (p2d.fireSlashBig ? 0.095 : 0.06));
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusY, 0, -0.92 + t * 0.4, 0.92 + t * 0.4);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(48,58,49,' + (alpha * 0.62).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1, unit * 0.025);
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX * 0.83, radiusY * 0.77, 0, -0.78 + t * 0.4, 0.78 + t * 0.4);
        ctx.stroke();
        ctx.restore();

        for (let i = 0; i < (p2d.fireSlashBig ? 12 : 6); i += 1) {
          const a = (i / 8 - 0.5) * 1.5;
          const r = unit * (p2d.fireSlashBig ? 3.8 : 2.2) * (0.65 + (i % 3) * 0.16);
          const ex = px + p2d.facing * Math.cos(a) * r;
          const ey = py - unit * 1.08 - Math.sin(a) * r * 0.4 - t * unit * 0.5;
          ctx.fillStyle = 'rgba(164,59,48,' + (alpha * 0.5).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(ex, ey, Math.max(1, unit * 0.03), 0, TAU);
          ctx.fill();
        }
      }
    }




draw2DPlayer = draw2DPlayerInk;
